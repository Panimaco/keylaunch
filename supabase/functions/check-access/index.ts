import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { activation_id, device_fingerprint } = await req.json();
  if (!activation_id || !device_fingerprint) {
    return errorResponse('activation_id and device_fingerprint are required');
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
    return jsonResponse({
      allowed: false,
      reason: 'Access revoked by creator',
    });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, executable_path')
    .eq('id', activation.project_id)
    .single();

  return jsonResponse({ allowed: true, project });
});
