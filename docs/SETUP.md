# Guía de configuración de cuentas

Sigue estos pasos para poner KeyLaunch en producción sin coste.

## 1. GitHub

1. Crea un repositorio público `keylaunch`.
2. Habilita GitHub Actions (incluido en el repo).
3. Crea releases para distribuir el launcher.

## 2. Supabase

1. Regístrate en [supabase.com](https://supabase.com).
2. Crea un proyecto (región cercana a tus usuarios).
3. En **Authentication → Providers**, habilita **Google**.
4. Copia `Project URL` y `anon key` → `.env`.
5. Copia `service_role key` → solo en Edge Functions (nunca en frontend).
6. Ejecuta migraciones:
   ```bash
   npx supabase link --project-ref YOUR_REF
   npx supabase db push
   npx supabase functions deploy
   ```

## 3. Google Cloud (OAuth)

1. Ve a [console.cloud.google.com](https://console.cloud.google.com).
2. Crea un proyecto → **APIs & Services → Credentials**.
3. Crea **OAuth 2.0 Client ID** (Web application).
4. Authorized redirect URIs:
   - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (desarrollo)
5. Pega Client ID y Secret en Supabase → Google provider.

## 4. Cloudflare R2

1. Regístrate en [cloudflare.com](https://cloudflare.com).
2. **R2 → Create bucket** → nombre: `keylaunch-builds`.
3. **Manage R2 API Tokens** → crea token con permiso Read/Write.
4. Anota: Account ID, Access Key, Secret Key.
5. Opcional: habilita dominio público o usa presigned URLs (recomendado).

## 5. VirusTotal

1. Regístrate en [virustotal.com](https://www.virustotal.com).
2. Perfil → **API Key**.
3. Plan gratuito: 500 consultas/día, 4 req/min.

## 6. Resend

1. Regístrate en [resend.com](https://resend.com).
2. Verifica un dominio (o usa dominio de prueba en dev).
3. Crea API key → `RESEND_API_KEY`.

## 7. Vercel (portal web)

1. Importa el repo en [vercel.com](https://vercel.com).
2. Root directory: `apps/web-creator`.
3. Añade variables de entorno desde `.env.example`.
4. Deploy.

## 8. Variables de entorno en Supabase Edge Functions

En Supabase Dashboard → Edge Functions → Secrets:

```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
VIRUSTOTAL_API_KEY
VT_DETECTION_THRESHOLD
RESEND_API_KEY
RESEND_FROM_EMAIL
SUPABASE_SERVICE_ROLE_KEY
```

## Verificación

1. Login con Google en el portal creador.
2. Crea un proyecto de prueba.
3. Sube un ZIP pequeño (< 50 MB).
4. Espera escaneo VT → estado `clean`.
5. Genera una clave.
6. Activa en el launcher y descarga.
