import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { getPresignedDownloadUrl } from '../_shared/r2.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { activation_id, version_id, device_fingerprint } = await req.json();
  if (!activation_id || !version_id || !device_fingerprint) {
    return errorResponse('activation_id, version_id, and device_fingerprint are required');
  }

  const supabase = getServiceClient();

  const { data: activation } = await supabase
    .from('activations')
    .select('id, status, device_fingerprint, project_id')
    .eq('id', activation_id)
    .single();

  if (!activation) return errorResponse('Activation not found', 404);
  if (activation.device_fingerprint !== device_fingerprint) {
    return errorResponse('Device mismatch', 403);
  }
  if (activation.status === 'revoked') {
    return errorResponse('Access revoked by creator', 403);
  }

  const { data: version } = await supabase
    .from('versions')
    .select('id, storage_key, sha256, scan_status, selectable, project_id')
    .eq('id', version_id)
    .single();

  if (!version || version.project_id !== activation.project_id) {
    return errorResponse('Version not found', 404);
  }
  if (!version.selectable) {
    return errorResponse('Version is not available for download', 403);
  }
  if (version.scan_status !== 'clean') {
    return errorResponse('Version has not passed security scan', 403);
  }

  const url = await getPresignedDownloadUrl(version.storage_key);
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  await supabase
    .from('activations')
    .update({ installed_version_id: version_id })
    .eq('id', activation_id);

  return jsonResponse({ url, sha256: version.sha256, expires_at: expiresAt });
});
