# KeyLaunch

Plataforma comunitaria **gratuita** para distribuir builds con claves de activación revocables, estilo Steam.

## Componentes

| Componente | Descripción | Tecnología |
|------------|-------------|------------|
| [web-creator](apps/web-creator) | Portal del creador | Next.js 14 |
| [launcher](apps/launcher) | Launcher de escritorio | Tauri 2 + React |
| [shared](packages/shared) | Tipos compartidos | TypeScript |
| [supabase](supabase) | Backend, auth, API | PostgreSQL + Edge Functions |

## Inicio rápido

### Requisitos

- Node.js 20+
- Rust (para el launcher)
- Cuentas: Supabase, Cloudflare R2, VirusTotal, Resend, Google Cloud

### Instalación

```bash
git clone https://github.com/your-org/keylaunch.git
cd keylaunch
cp .env.example .env
# Configura variables (ver docs/SETUP.md)

npm install
npm run build:shared
```

### Desarrollo

```bash
# Portal creador
npm run dev:web

# Launcher (requiere Rust)
npm run dev:launcher

# Supabase local
npx supabase start
npx supabase functions serve
```

### Despliegue

Ver [docs/SETUP.md](docs/SETUP.md) para configuración completa de cuentas.

## Flujo principal

1. **Creador** inicia sesión con Google → crea proyecto → sube ZIP → escaneo VirusTotal → genera claves.
2. **Jugador** abre launcher → activa clave → descarga build → elige versión → ejecuta.

## Límites gratuitos

Ver [docs/LIMITS.md](docs/LIMITS.md).

## Licencia

MIT — ver [LICENSE](LICENSE).
