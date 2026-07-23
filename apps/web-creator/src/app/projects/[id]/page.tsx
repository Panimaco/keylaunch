import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProjectDetail } from '@/components/ProjectDetail';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single();

  if (!project) notFound();

  const { data: versions } = await supabase
    .from('versions')
    .select('*')
    .eq('project_id', id)
    .order('version_number', { ascending: false });

  const { data: keys } = await supabase
    .from('access_keys')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const { data: activations } = await supabase
    .from('activations')
    .select('*, access_keys(code_prefix), versions(version_number)')
    .eq('project_id', id)
    .order('activated_at', { ascending: false });

  return (
    <div className="min-h-screen">
      <Navbar email={user.email} />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <ProjectDetail
          projectId={id}
          project={{
            name: project.name,
            description: project.description,
            executable_path: project.executable_path,
          }}
          versions={versions ?? []}
          keys={keys ?? []}
          activations={activations ?? []}
        />
      </main>
    </div>
  );
}
