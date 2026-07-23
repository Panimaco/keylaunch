'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  storage_used_bytes: number;
  created_at: string;
}

export function ProjectList({
  projects,
  canCreate,
  userId,
}: {
  projects: ProjectRow[];
  canCreate: boolean;
  userId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [executablePath, setExecutablePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('projects').insert({
      creator_id: userId,
      name,
      description: description || null,
      executable_path: executablePath,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="card block hover:border-indigo-500 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold">{project.name}</h2>
              {project.description && (
                <p className="text-[var(--muted)] text-sm mt-1">{project.description}</p>
              )}
            </div>
            <span className="text-sm text-[var(--muted)]">
              {(project.storage_used_bytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </Link>
      ))}

      {projects.length === 0 && !showForm && (
        <p className="text-[var(--muted)] text-center py-12">
          Aún no tienes proyectos. Crea uno para empezar.
        </p>
      )}

      {showForm ? (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h2 className="text-lg font-semibold">Nuevo proyecto</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Descripción</label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Ruta del ejecutable (dentro del ZIP)</label>
            <input
              className="input"
              value={executablePath}
              onChange={(e) => setExecutablePath(e.target.value)}
              placeholder="Game/Binaries/Win64/MyGame.exe"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando…' : 'Crear proyecto'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : canCreate ? (
        <button onClick={() => setShowForm(true)} className="btn-primary w-full">
          + Nuevo proyecto
        </button>
      ) : (
        <p className="text-center text-[var(--muted)] text-sm">
          Has alcanzado el límite de proyectos.
        </p>
      )}
    </div>
  );
}
