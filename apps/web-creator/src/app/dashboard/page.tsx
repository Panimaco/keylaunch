import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProjectList } from '@/components/ProjectList';
import { LIMITS } from '@keylaunch/shared';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: projects } = await supabase
    .from('projects')
    .select('*, versions(count), activations(count)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  const totalStorage = projects?.reduce((sum, p) => sum + (p.storage_used_bytes || 0), 0) ?? 0;

  return (
    <div className="min-h-screen">
      <Navbar email={user.email} />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis proyectos</h1>
            <p className="text-[var(--muted)]">
              {projects?.length ?? 0}/{LIMITS.MAX_PROJECTS_PER_CREATOR} proyectos ·{' '}
              {(totalStorage / (1024 * 1024 * 1024)).toFixed(2)}/{LIMITS.MAX_TOTAL_STORAGE_BYTES / (1024 * 1024 * 1024)} GB
            </p>
          </div>
        </div>
        <ProjectList
          projects={projects ?? []}
          canCreate={(projects?.length ?? 0) < LIMITS.MAX_PROJECTS_PER_CREATOR}
          userId={user.id}
        />
      </main>
    </div>
  );
}
