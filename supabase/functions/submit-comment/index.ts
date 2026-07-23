import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const RATE_LIMIT_SECONDS = 600;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { activation_id, version_id, body, device_fingerprint } = await req.json();
  if (!activation_id || !body || !device_fingerprint) {
    return errorResponse('activation_id, body, and device_fingerprint are required');
  }
  if (body.length > 2000) return errorResponse('Comment too long');

  const supabase = getServiceClient();

  const { data: activation } = await supabase
    .from('activations')
    .select('id, status, device_fingerprint, project_id, last_comment_at')
    .eq('id', activation_id)
    .single();

  if (!activation) return errorResponse('Activation not found', 404);
  if (activation.device_fingerprint !== device_fingerprint) {
    return errorResponse('Device mismatch', 403);
  }
  if (activation.status === 'revoked') {
    return errorResponse('Access revoked', 403);
  }

  if (activation.last_comment_at) {
    const elapsed = Date.now() - new Date(activation.last_comment_at).getTime();
    if (elapsed < RATE_LIMIT_SECONDS * 1000) {
      return errorResponse('Rate limit: wait before sending another comment', 429);
    }
  }

  const { data: project } = await supabase
    .from('projects')
    .select('name, creator_id')
    .eq('id', activation.project_id)
    .single();

  const { data: creator } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', project!.creator_id)
    .single();

  await supabase.from('comments').insert({
    project_id: activation.project_id,
    activation_id,
    version_id: version_id ?? null,
    body,
  });

  await supabase
    .from('activations')
    .update({ last_comment_at: new Date().toISOString() })
    .eq('id', activation_id);

  if (creator?.email && Deno.env.get('RESEND_API_KEY')) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'KeyLaunch <noreply@keylaunch.app>',
        to: [creator.email],
        subject: `Nuevo comentario en ${project!.name}`,
        text: body,
      }),
    });
  }

  return jsonResponse({ sent: true });
});
