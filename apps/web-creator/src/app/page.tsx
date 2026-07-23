import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoginButton } from '@/components/LoginButton';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  const launcherUrl = process.env.NEXT_PUBLIC_LAUNCHER_DOWNLOAD_URL ||
    'https://github.com/keylaunch/keylaunch/releases/latest';

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-indigo-400">KeyLaunch</span>
        <nav className="flex gap-4 items-center text-sm">
          <Link href="/legal/terms" className="text-[var(--muted)] hover:text-white">Términos</Link>
          <Link href="/legal/privacy" className="text-[var(--muted)] hover:text-white">Privacidad</Link>
          <LoginButton />
        </nav>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Distribuye builds como Steam,{' '}
            <span className="text-indigo-400">gratis</span>
          </h1>
          <p className="text-xl text-[var(--muted)] mb-10 max-w-2xl mx-auto">
            Sube tu build, genera claves revocables y deja que tus testers las activen
            desde un launcher de escritorio. Escaneo antivirus incluido.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <LoginButton large />
            <a
              href={launcherUrl}
              className="btn-secondary text-lg px-8 py-3"
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar launcher
            </a>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-xl font-semibold mb-3">Para creadores</h2>
            <ul className="space-y-2 text-[var(--muted)]">
              <li>• Login con Google</li>
              <li>• Sube builds ZIP escaneadas con VirusTotal</li>
              <li>• Genera claves de un solo uso revocables</li>
              <li>• Controla qué versiones pueden probar</li>
              <li>• Recibe comentarios por email</li>
            </ul>
          </div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-3">Para jugadores</h2>
            <ul className="space-y-2 text-[var(--muted)]">
              <li>• Activa con clave, sin cuenta obligatoria</li>
              <li>• Descarga e instala como Steam</li>
              <li>• Elige versión y ejecuta el juego</li>
              <li>• Envía feedback al creador</li>
            </ul>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Límites gratuitos</h2>
          <p className="text-[var(--muted)]">
            3 proyectos · 2 GB por proyecto · 50 activaciones · 200 claves.
            KeyLaunch es un regalo a la comunidad.
          </p>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-8 text-center text-sm text-[var(--muted)]">
        KeyLaunch · MIT License · Hecho para la comunidad
      </footer>
    </div>
  );
}
