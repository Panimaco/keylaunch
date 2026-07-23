'use client';

import { createClient } from '@/lib/supabase/client';

export function LoginButton({ large = false }: { large?: boolean }) {
  const supabase = createClient();

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={handleLogin}
      className={large ? 'btn-primary text-lg px-8 py-3' : 'btn-primary'}
    >
      Iniciar sesión con Google
    </button>
  );
}
