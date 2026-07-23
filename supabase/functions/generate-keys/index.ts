import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, getServiceClient } from '../_shared/supabase.ts';
import { generateKeyCode, hashKeyCode, keyPrefix } from '../_shared/keys.ts';

const MAX_KEYS = 50;
const MAX_KEYS_PER_PROJECT = 200;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const user = await getAuthenticatedUser(req);
  if (!user) return errorResponse('Unauthorized', 401);

  const { project_id, count } = await req.json();
  if (!project_id || !count || count < 1 || count > MAX_KEYS) {
    return errorResponse(`count must be between 1 and ${MAX_KEYS}`);
  }

  const supabase = getServiceClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, creator_id')
    .eq('id', project_id)
    .single();

  if (!project || project.creator_id !== user.id) {
    return errorResponse('Project not found', 404);
  }

  const { count: existingCount } = await supabase
    .from('access_keys')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', project_id);

  if ((existingCount ?? 0) + count > MAX_KEYS_PER_PROJECT) {
    return errorResponse(`Maximum ${MAX_KEYS_PER_PROJECT} keys per project`);
  }

  const generatedKeys: string[] = [];
  const rows = [];

  for (let i = 0; i < count; i++) {
    const code = generateKeyCode();
    const hash = await hashKeyCode(code);
    generatedKeys.push(code);
    rows.push({
      project_id,
      code_hash: hash,
      code_prefix: keyPrefix(code),
      status: 'available',
    });
  }

  const { error } = await supabase.from('access_keys').insert(rows);
  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ keys: generatedKeys });
});
