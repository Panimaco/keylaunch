import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, getServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const user = await getAuthenticatedUser(req);
  if (!user) return errorResponse('Unauthorized', 401);

  const { project_id, storage_key, version_number, sha256, file_size_bytes, changelog } =
    await req.json();

  if (!project_id || !storage_key || !version_number || !sha256 || !file_size_bytes) {
    return errorResponse('Missing required fields');
  }

  const supabase = getServiceClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, creator_id, storage_used_bytes')
    .eq('id', project_id)
    .single();

  if (!project || project.creator_id !== user.id) {
    return errorResponse('Project not found', 404);
  }

  const isFirstVersion = version_number === 1;

  const { data: version, error: versionError } = await supabase
    .from('versions')
    .insert({
      project_id,
      version_number,
      storage_key,
      sha256,
      file_size_bytes,
      changelog: changelog ?? null,
      selectable: isFirstVersion,
      is_latest: true,
      scan_status: 'pending_scan',
    })
    .select('id')
    .single();

  if (versionError) return errorResponse(versionError.message, 500);

  await supabase
    .from('versions')
    .update({ is_latest: false })
    .eq('project_id', project_id)
    .neq('id', version.id);

  await supabase
    .from('projects')
    .update({ storage_used_bytes: project.storage_used_bytes + file_size_bytes })
    .eq('id', project_id);

  await supabase.from('scan_jobs').insert({
    version_id: version.id,
    status: 'queued',
  });

  return jsonResponse({ version_id: version.id, scan_status: 'pending_scan' });
});
