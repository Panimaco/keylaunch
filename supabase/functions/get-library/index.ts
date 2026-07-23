import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { activation_ids } = await req.json();
  if (!activation_ids?.length) return errorResponse('activation_ids required');

  const supabase = getServiceClient();

  const results = [];

  for (const activationId of activation_ids) {
    const { data: activation } = await supabase
      .from('activations')
      .select('id, status, installed_version_id, project_id')
      .eq('id', activationId)
      .single();

    if (!activation) continue;

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description, icon_url, executable_path')
      .eq('id', activation.project_id)
      .single();

    const { data: versions } = await supabase
      .from('versions')
      .select('id, version_number, selectable, is_latest, scan_status')
      .eq('project_id', activation.project_id)
      .eq('selectable', true)
      .eq('scan_status', 'clean')
      .order('version_number', { ascending: false });

    results.push({
      activation_id: activation.id,
      project,
      status: activation.status,
      installed_version_id: activation.installed_version_id,
      versions: versions ?? [],
    });
  }

  return jsonResponse({ library: results });
});
