import { useState } from 'react';
import { activateKey } from '../lib/api';
import { saveActivation } from '../lib/tauri';
import type { DeviceInfo } from '../lib/tauri';

export function ActivateView({
  device,
  onActivated,
}: {
  device: DeviceInfo;
  onActivated: () => void;
}) {
  const [code, setCode] = useState('');
  const [deviceName, setDeviceName] = useState(device.hostname);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await activateKey(code, deviceName, device.fingerprint);
      await saveActivation(result.activation_id);
      onActivated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al activar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '4rem auto' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Activar clave</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Introduce tu clave de acceso para añadir un proyecto a tu biblioteca.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Clave
          </label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXXX-XXXXX-XXXXX"
            required
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Nombre del dispositivo
          </label>
          <input
            className="input"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Activando…' : 'Activar'}
        </button>
      </form>
    </div>
  );
}
