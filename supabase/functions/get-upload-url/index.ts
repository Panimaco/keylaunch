import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, getServiceClient } from '../_shared/supabase.ts';
import { buildStorageKey, getPresignedUploadUrl } from '../_shared/r2.ts';

const MAX_ZIP = 2 * 1024 * 1024 * 1024;
const MAX_VERSIONS = 20;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const user = await getAuthenticatedUser(req);
  if (!user) return errorResponse('Unauthorized', 401);

  const { project_id, file_size_bytes, sha256 } = await req.json();
  if (!project_id || !file_size_bytes || !sha256) {
    return errorResponse('project_id, file_size_bytes, and sha256 are required');
  }
  if (file_size_bytes > MAX_ZIP) {
    return errorResponse('File exceeds 2 GB limit');
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

  if (project.storage_used_bytes + file_size_bytes > MAX_ZIP) {
    return errorResponse('Project storage limit exceeded (2 GB)');
  }

  const { count: versionCount } = await supabase
    .from('versions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', project_id);

  if ((versionCount ?? 0) >= MAX_VERSIONS) {
    return errorResponse(`Maximum ${MAX_VERSIONS} versions per project`);
  }

  const nextVersion = (versionCount ?? 0) + 1;
  const storageKey = buildStorageKey(project_id, nextVersion);
  const uploadUrl = await getPresignedUploadUrl(storageKey, 'application/zip');

  return jsonResponse({
    upload_url: uploadUrl,
    storage_key: storageKey,
    version_number: nextVersion,
    sha256,
  });
});
