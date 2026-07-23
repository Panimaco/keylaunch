import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, getServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const user = await getAuthenticatedUser(req);
  if (!user) return errorResponse('Unauthorized', 401);

  const { activation_id } = await req.json();
  if (!activation_id) return errorResponse('activation_id is required');

  const supabase = getServiceClient();

  const { data: activation } = await supabase
    .from('activations')
    .select('id, project_id, projects(creator_id)')
    .eq('id', activation_id)
    .single();

  if (!activation) return errorResponse('Activation not found', 404);

  const project = activation.projects as { creator_id: string };
  if (project.creator_id !== user.id) {
    return errorResponse('Unauthorized', 403);
  }

  await supabase
    .from('activations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', activation_id);

  return jsonResponse({ revoked: true });
});
