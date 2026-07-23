import { useEffect, useState } from 'react';
import type { LibraryItem } from '../lib/api';
import {
  checkAccess,
  getDownloadUrl,
  submitComment,
} from '../lib/api';
import {
  downloadAndInstall,
  getInstallInfo,
  launchExecutable,
} from '../lib/tauri';
import type { DeviceInfo } from '../lib/tauri';

export function ProjectPanel({
  item,
  device,
  onRefresh,
}: {
  item: LibraryItem;
  device: DeviceInfo;
  onRefresh: () => void;
}) {
  const [selectedVersionId, setSelectedVersionId] = useState(
    item.versions.find((v) => v.is_latest)?.id ||
      item.versions[0]?.id ||
      '',
  );
  const [installPath, setInstallPath] = useState<string | null>(null);
  const [installedVersionId, setInstalledVersionId] = useState<string | null>(
    item.installed_version_id,
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commentSent, setCommentSent] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [revoked, setRevoked] = useState(item.status === 'revoked');

  useEffect(() => {
    getInstallInfo(item.project.id).then((info) => {
      if (info.installed) {
        setInstallPath(info.install_path);
        setInstalledVersionId(info.version_id);
      }
    });
  }, [item.project.id]);

  async function handleDownload() {
    if (revoked) return;
    setDownloading(true);
    setError('');
    setDownloadProgress(10);

    try {
      const access = await checkAccess(item.activation_id, device.fingerprint);
      if (!access.allowed) {
        setRevoked(true);
        throw new Error(access.reason || 'Acceso revocado');
      }

      setDownloadProgress(30);
      const { url, sha256 } = await getDownloadUrl(
        item.activation_id,
        selectedVersionId,
        device.fingerprint,
      );

      setDownloadProgress(50);
      const path = await downloadAndInstall(
        item.project.id,
        selectedVersionId,
        url,
        sha256,
      );

      setInstallPath(path);
      setInstalledVersionId(selectedVersionId);
      setDownloadProgress(100);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar');
    } finally {
      setDownloading(false);
    }
  }

  async function handleLaunch() {
    if (!installPath || revoked) return;

    const access = await checkAccess(item.activation_id, device.fingerprint);
    if (!access.allowed) {
      setRevoked(true);
      setError(access.reason || 'Acceso revocado por el creador');
      return;
    }

    try {
      await launchExecutable(installPath, item.project.executable_path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar');
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitComment(
        item.activation_id,
        comment,
        device.fingerprint,
        selectedVersionId,
      );
      setCommentSent(true);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    }
  }

  const isInstalled = installedVersionId === selectedVersionId && installPath;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.project.name}</h2>
      {item.project.description && (
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {item.project.description}
        </p>
      )}

      {revoked && (
        <div className="card" style={{ borderColor: '#ef4444', marginBottom: '1rem' }}>
          <p style={{ color: '#f87171' }}>
            Acceso revocado por el creador. No puedes descargar ni ejecutar.
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Versión</h3>
        <select
          className="input"
          value={selectedVersionId}
          onChange={(e) => setSelectedVersionId(e.target.value)}
          disabled={revoked}
        >
          {item.versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version_number}
              {v.is_latest ? ' (recomendada)' : ''}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading || revoked || !selectedVersionId}
          >
            {downloading
              ? 'Descargando…'
              : isInstalled
                ? 'Reinstalar'
                : 'Descargar'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleLaunch}
            disabled={!isInstalled || revoked}
          >
            Ejecutar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowComment(!showComment)}
            disabled={revoked}
          >
            Comentar
          </button>
        </div>

        {downloading && (
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${downloadProgress}%` }} />
          </div>
        )}

        {installPath && (
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            Instalado en: {installPath}
          </p>
        )}

        {error && <p className="error">{error}</p>}
      </div>

      {showComment && (
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Enviar comentario al creador</h3>
          <form onSubmit={handleComment}>
            <textarea
              className="input"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tu feedback…"
              required
              maxLength={2000}
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
              Enviar
            </button>
            {commentSent && <p className="success">Comentario enviado.</p>}
          </form>
        </div>
      )}
    </div>
  );
}
