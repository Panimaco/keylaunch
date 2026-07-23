'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function Navbar({ email }: { email?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--border)] px-6 py-4 flex justify-between items-center">
      <Link href="/dashboard" className="text-xl font-bold text-indigo-400">
        KeyLaunch
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {email && <span className="text-[var(--muted)]">{email}</span>}
        <button onClick={handleLogout} className="text-[var(--muted)] hover:text-white">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
