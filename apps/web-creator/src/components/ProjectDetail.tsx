'use client';

import { useState } from 'react';
import { uploadBuild, triggerScanQueue, generateKeys, revokeActivation } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { ScanStatusBadge } from './ScanStatusBadge';
import type { ScanStatus, KeyStatus, ActivationStatus } from '@keylaunch/shared';
import { useRouter } from 'next/navigation';

interface Version {
  id: string;
  version_number: number;
  changelog: string | null;
  file_size_bytes: number;
  selectable: boolean;
  is_latest: boolean;
  scan_status: ScanStatus;
  vt_report_url: string | null;
  created_at: string;
}

interface AccessKey {
  id: string;
  code_prefix: string;
  status: KeyStatus;
  created_at: string;
}

interface Activation {
  id: string;
  device_name: string;
  status: ActivationStatus;
  activated_at: string;
  access_keys: { code_prefix: string } | null;
  versions: { version_number: number } | null;
}

export function ProjectDetail({
  projectId,
  project,
  versions: initialVersions,
  keys: initialKeys,
  activations: initialActivations,
}: {
  projectId: string;
  project: {
    name: string;
    description: string | null;
    executable_path: string;
  };
  versions: Version[];
  keys: AccessKey[];
  activations: Activation[];
}) {
  const [tab, setTab] = useState<'versions' | 'keys' | 'activations' | 'settings'>('versions');
  const [versions, setVersions] = useState(initialVersions);
  const [keys, setKeys] = useState(initialKeys);
  const [activations, setActivations] = useState(initialActivations);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [keyCount, setKeyCount] = useState(5);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [executablePath, setExecutablePath] = useState(project.executable_path);
  const router = useRouter();
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      setUploadError('Solo se admiten archivos .zip');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      await uploadBuild(projectId, file);
      await triggerScanQueue();
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  async function toggleSelectable(versionId: string, selectable: boolean) {
    await supabase.from('versions').update({ selectable }).eq('id', versionId);
    setVersions((v) => v.map((x) => (x.id === versionId ? { ...x, selectable } : x)));
  }

  async function setLatest(versionId: string) {
    await supabase.from('versions').update({ is_latest: false }).eq('project_id', projectId);
    await supabase.from('versions').update({ is_latest: true }).eq('id', versionId);
    setVersions((v) =>
      v.map((x) => ({ ...x, is_latest: x.id === versionId })),
    );
  }

  async function handleGenerateKeys() {
    try {
      const result = await generateKeys(projectId, keyCount);
      setGeneratedKeys(result.keys);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleRevokeKey(keyId: string) {
    await supabase.from('access_keys').update({ status: 'revoked' }).eq('id', keyId);
    setKeys((k) => k.map((x) => (x.id === keyId ? { ...x, status: 'revoked' as KeyStatus } : x)));
  }

  async function handleRevokeActivation(activationId: string) {
    try {
      await revokeActivation(activationId);
      setActivations((a) =>
        a.map((x) => (x.id === activationId ? { ...x, status: 'revoked' as ActivationStatus } : x)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  async function saveSettings() {
    await supabase
      .from('projects')
      .update({ executable_path: executablePath })
      .eq('id', projectId);
    router.refresh();
  }

  const tabs = [
    { id: 'versions' as const, label: 'Versiones' },
    { id: 'keys' as const, label: 'Claves' },
    { id: 'activations' as const, label: 'Activaciones' },
    { id: 'settings' as const, label: 'Ajustes' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-[var(--muted)] mt-2">{project.description}</p>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-[var(--muted)] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'versions' && (
        <div className="space-y-4">
          <div className="card">
            <label className="btn-primary cursor-pointer inline-block">
              {uploading ? 'Subiendo…' : 'Subir nueva versión (.zip)'}
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            {uploadError && <p className="text-red-400 text-sm mt-2">{uploadError}</p>}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="pb-3 pr-4">Versión</th>
                  <th className="pb-3 pr-4">Tamaño</th>
                  <th className="pb-3 pr-4">Escaneo</th>
                  <th className="pb-3 pr-4">Seleccionable</th>
                  <th className="pb-3">Latest</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4">v{v.version_number}</td>
                    <td className="py-3 pr-4">
                      {(v.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </td>
                    <td className="py-3 pr-4">
                      <ScanStatusBadge status={v.scan_status} />
                      {v.vt_report_url && (
                        <a
                          href={v.vt_report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-indigo-400 text-xs"
                        >
                          VT
                        </a>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={v.selectable}
                        disabled={v.scan_status !== 'clean'}
                        onChange={(e) => toggleSelectable(v.id, e.target.checked)}
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="radio"
                        name="latest"
                        checked={v.is_latest}
                        onChange={() => setLatest(v.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {versions.length === 0 && (
              <p className="text-[var(--muted)] text-center py-8">Sin versiones aún.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'keys' && (
        <div className="space-y-4">
          <div className="card flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm mb-1">Cantidad (1–50)</label>
              <input
                type="number"
                className="input w-24"
                min={1}
                max={50}
                value={keyCount}
                onChange={(e) => setKeyCount(Number(e.target.value))}
              />
            </div>
            <button onClick={handleGenerateKeys} className="btn-primary">
              Generar claves
            </button>
          </div>

          {generatedKeys.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-2">Claves generadas (cópialas ahora)</h3>
              <pre className="text-sm bg-[var(--bg)] p-4 rounded-lg overflow-x-auto">
                {generatedKeys.join('\n')}
              </pre>
            </div>
          )}

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="pb-3 pr-4">Clave</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4 font-mono">{k.code_prefix}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge-${k.status === 'available' ? 'success' : k.status === 'used' ? 'neutral' : 'danger'}`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {k.status === 'available' && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="text-red-400 text-xs hover:underline"
                        >
                          Revocar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'activations' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="pb-3 pr-4">Dispositivo</th>
                <th className="pb-3 pr-4">Clave</th>
                <th className="pb-3 pr-4">Versión</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activations.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-3 pr-4">{a.device_name}</td>
                  <td className="py-3 pr-4 font-mono">{a.access_keys?.code_prefix ?? '—'}</td>
                  <td className="py-3 pr-4">
                    {a.versions ? `v${a.versions.version_number}` : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={a.status === 'active' ? 'badge-success' : 'badge-danger'}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {a.status === 'active' && (
                      <button
                        onClick={() => handleRevokeActivation(a.id)}
                        className="text-red-400 text-xs hover:underline"
                      >
                        Revocar acceso
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activations.length === 0 && (
            <p className="text-[var(--muted)] text-center py-8">Sin activaciones aún.</p>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="card space-y-4 max-w-lg">
          <div>
            <label className="block text-sm mb-1">Ruta del ejecutable</label>
            <input
              className="input"
              value={executablePath}
              onChange={(e) => setExecutablePath(e.target.value)}
            />
          </div>
          <button onClick={saveSettings} className="btn-primary">
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
