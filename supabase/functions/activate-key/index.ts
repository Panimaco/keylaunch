import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { hashKeyCode } from '../_shared/keys.ts';

const MAX_ACTIVE = 50;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { code, device_name, device_fingerprint } = await req.json();
  if (!code || !device_name || !device_fingerprint) {
    return errorResponse('code, device_name, and device_fingerprint are required');
  }

  const supabase = getServiceClient();
  const codeHash = await hashKeyCode(code);

  const { data: key } = await supabase
    .from('access_keys')
    .select('id, project_id, status')
    .eq('code_hash', codeHash)
    .single();

  if (!key) return errorResponse('Invalid key', 404);
  if (key.status === 'revoked') return errorResponse('Key has been revoked', 403);
  if (key.status === 'used') return errorResponse('Key has already been used', 409);

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description, icon_url, executable_path')
    .eq('id', key.project_id)
    .single();

  if (!project) return errorResponse('Project not found', 404);

  const { count: activeCount } = await supabase
    .from('activations')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', key.project_id)
    .eq('status', 'active');

  if ((activeCount ?? 0) >= MAX_ACTIVE) {
    return errorResponse('Project has reached maximum active activations', 403);
  }

  const { data: activation, error: activationError } = await supabase
    .from('activations')
    .insert({
      key_id: key.id,
      project_id: key.project_id,
      device_name,
      device_fingerprint,
      status: 'active',
    })
    .select('id')
    .single();

  if (activationError) return errorResponse(activationError.message, 500);

  await supabase.from('access_keys').update({ status: 'used' }).eq('id', key.id);

  return jsonResponse({
    activation_id: activation.id,
    project,
  });
});
