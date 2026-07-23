# Supabase Edge Functions

| Función | Auth | Descripción |
|---------|------|-------------|
| `generate-keys` | JWT creador | Genera lote de claves |
| `get-upload-url` | JWT creador | Presigned URL para subir ZIP a R2 |
| `complete-upload` | JWT creador | Registra versión y encola escaneo VT |
| `process-scan-queue` | Público/cron | Procesa cola VirusTotal (4 req/min) |
| `activate-key` | Público | Activa clave (un solo uso) |
| `check-access` | Público | Verifica revocación |
| `get-download-url` | Público | URL firmada de descarga |
| `get-library` | Público | Biblioteca del launcher |
| `submit-comment` | Público | Comentario → email creador |
| `revoke-activation` | JWT creador | Revoca acceso de un jugador |

## Despliegue

```bash
supabase functions deploy generate-keys
supabase functions deploy get-upload-url
supabase functions deploy complete-upload
supabase functions deploy process-scan-queue
supabase functions deploy activate-key
supabase functions deploy check-access
supabase functions deploy get-download-url
supabase functions deploy get-library
supabase functions deploy submit-comment
supabase functions deploy revoke-activation
```

## Cron recomendado

Programar `process-scan-queue` cada 5 minutos vía GitHub Actions schedule o Supabase pg_cron:

```yaml
# .github/workflows/ci.yml — añadir:
on:
  schedule:
    - cron: '*/5 * * * *'
```
