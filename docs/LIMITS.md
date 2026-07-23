# Límites gratuitos de KeyLaunch

KeyLaunch es un regalo a la comunidad. Para mantener el servicio **100% gratuito**, aplicamos estos límites basados en las cuotas de los proveedores free tier.

## Límites por creador

| Recurso | Límite |
|---------|--------|
| Proyectos activos | 3 |
| Almacenamiento total | 6 GB (2 GB por proyecto) |
| Claves generadas por proyecto | 200 |
| Activaciones simultáneas por proyecto | 50 |
| Versiones por proyecto | 20 |

## Límites por build

| Recurso | Límite |
|---------|--------|
| Tamaño máximo del ZIP | 2 GB |
| Formatos soportados | `.zip` (v1) |
| Tiempo máximo de escaneo VT | ~30 min (cola) |

## Límites del launcher (jugador)

| Recurso | Límite |
|---------|--------|
| Comentarios | 1 cada 10 minutos por dispositivo |
| Activaciones por clave | 1 (un solo uso) |
| Cuenta Google | Opcional |

## Cuotas de infraestructura (referencia técnica)

| Servicio | Cuota free | Uso en KeyLaunch |
|----------|------------|------------------|
| Cloudflare R2 | 10 GB/mes | Almacenamiento de builds |
| Supabase | 500 MB DB, 1 GB storage | Metadatos, auth |
| VirusTotal API | 500 req/día, 4 req/min | Escaneo de builds |
| Resend | 100 emails/día | Comentarios a creadores |
| Vercel | Ancho de banda generoso | Portal creador + landing |
| GitHub Releases | Ilimitado (repos públicos) | Distribución del launcher |

## Qué pasa al superar un límite

- **Subida de build**: rechazada con mensaje claro indicando el límite.
- **Generación de claves**: bloqueada hasta revocar claves no usadas o activaciones.
- **Escaneo VT**: la build entra en cola; el creador ve estado `pending_scan`.
- **Comentarios**: rate limit devuelve error 429.

## Futuro

Si la comunidad supera las cuotas gratuitas, las opciones son:

1. Donaciones para ampliar cuotas.
2. Self-hosted (Docker) con almacenamiento propio del creador.
3. Priorizar proyectos más antiguos en cola de escaneo.
