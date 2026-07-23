import { useEffect, useState } from 'react';
import { getLibrary, type LibraryItem } from '../lib/api';
import { getDeviceInfo, getSavedActivations } from '../lib/tauri';
import type { DeviceInfo } from '../lib/tauri';
import { ActivateView } from './ActivateView';
import { ProjectPanel } from './ProjectPanel';

type View = 'library' | 'activate';

export default function App() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>('library');
  const [loading, setLoading] = useState(true);

  async function loadLibrary() {
    const ids = await getSavedActivations();
    if (ids.length === 0) {
      setLibrary([]);
      setLoading(false);
      return;
    }
    const { library: items } = await getLibrary(ids);
    setLibrary(items);
    if (items.length > 0 && !selectedId) {
      setSelectedId(items[0].activation_id);
    }
    setLoading(false);
  }

  useEffect(() => {
    getDeviceInfo().then(setDevice);
    loadLibrary();
  }, []);

  if (!device) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Cargando…
      </div>
    );
  }

  if (view === 'activate') {
    return (
      <div>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <button className="btn btn-secondary" onClick={() => setView('library')}>
            ← Biblioteca
          </button>
        </div>
        <ActivateView
          device={device}
          onActivated={() => {
            setView('library');
            setLoading(true);
            loadLibrary();
          }}
        />
      </div>
    );
  }

  const selected = library.find((l) => l.activation_id === selectedId);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>KeyLaunch</h1>
        {library.map((item) => (
          <div
            key={item.activation_id}
            className={`sidebar-item ${selectedId === item.activation_id ? 'active' : ''}`}
            onClick={() => setSelectedId(item.activation_id)}
          >
            {item.project.name}
            {item.status === 'revoked' && (
              <span style={{ color: '#f87171', fontSize: '0.7rem', marginLeft: 4 }}>✕</span>
            )}
          </div>
        ))}
        <button
          className="btn btn-secondary"
          style={{ marginTop: 'auto', fontSize: '0.85rem' }}
          onClick={() => setView('activate')}
        >
          + Activar clave
        </button>
      </aside>

      <main className="main">
        {loading && <p style={{ color: 'var(--muted)' }}>Cargando biblioteca…</p>}
        {!loading && library.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
              Tu biblioteca está vacía. Activa una clave para empezar.
            </p>
            <button className="btn btn-primary" onClick={() => setView('activate')}>
              Activar clave
            </button>
          </div>
        )}
        {selected && (
          <ProjectPanel
            item={selected}
            device={device}
            onRefresh={loadLibrary}
          />
        )}
      </main>
    </div>
  );
}
