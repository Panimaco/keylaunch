import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { scanHash } from '../_shared/virustotal.ts';

const MAX_ATTEMPTS = 3;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const supabase = getServiceClient();

  const { data: jobs } = await supabase
    .from('scan_jobs')
    .select('id, version_id, attempts, versions(id, sha256, project_id)')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(4);

  if (!jobs?.length) {
    return jsonResponse({ processed: 0, message: 'No jobs in queue' });
  }

  let processed = 0;

  for (const job of jobs) {
    const version = job.versions as { id: string; sha256: string; project_id: string } | null;
    if (!version) continue;

    await supabase.from('scan_jobs').update({ status: 'processing' }).eq('id', job.id);
    await supabase.from('versions').update({ scan_status: 'scanning' }).eq('id', version.id);

    try {
      const result = await scanHash(version.sha256);

      let scanStatus: 'clean' | 'infected' | 'rejected' = result.status === 'infected' ? 'infected' : 'clean';
      if (result.status === 'unknown') {
        scanStatus = 'pending_scan';
      }

      await supabase
        .from('versions')
        .update({
          scan_status: scanStatus,
          vt_report_url: result.reportUrl,
          vt_positives: result.positives,
          vt_total: result.total,
        })
        .eq('id', version.id);

      await supabase
        .from('scan_jobs')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', job.id);

      processed++;
    } catch (err) {
      const attempts = job.attempts + 1;
      const failed = attempts >= MAX_ATTEMPTS;

      await supabase
        .from('scan_jobs')
        .update({
          status: failed ? 'failed' : 'queued',
          attempts,
          error_message: String(err),
        })
        .eq('id', job.id);

      if (failed) {
        await supabase.from('versions').update({ scan_status: 'rejected' }).eq('id', version.id);
      } else {
        await supabase.from('versions').update({ scan_status: 'pending_scan' }).eq('id', version.id);
      }
    }

    await new Promise((r) => setTimeout(r, 15000));
  }

  return jsonResponse({ processed });
});
