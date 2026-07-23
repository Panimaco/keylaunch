# Guía de prueba beta

Checklist para validar KeyLaunch con 2–3 creadores reales antes del lanzamiento público.

## Pre-requisitos

- [ ] Supabase configurado con migraciones aplicadas
- [ ] Edge Functions desplegadas
- [ ] R2 bucket creado con credenciales en secrets
- [ ] Google OAuth funcionando
- [ ] VirusTotal API key activa
- [ ] Resend configurado (opcional para beta de comentarios)
- [ ] Portal web desplegado en Vercel
- [ ] Launcher compilado y subido a GitHub Releases

## Flujo creador (15 min)

1. [ ] Login con Google en el portal
2. [ ] Crear proyecto con nombre y ruta de ejecutable
3. [ ] Subir ZIP de prueba (< 100 MB recomendado para beta)
4. [ ] Verificar estado `pending_scan` → ejecutar cola VT manualmente:
   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/process-scan-queue" \
     -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" -d '{}'
   ```
5. [ ] Confirmar estado `clean` y enlace VT
6. [ ] Marcar versión como seleccionable y latest
7. [ ] Generar 3 claves
8. [ ] Copiar una clave para el tester

## Flujo jugador (15 min)

1. [ ] Instalar launcher desde GitHub Releases
2. [ ] Abrir launcher → "Activar clave"
3. [ ] Verificar hostname pre-rellenado (DESKTOP-XXX)
4. [ ] Activar con clave del creador
5. [ ] Proyecto aparece en biblioteca
6. [ ] Descargar versión
7. [ ] Verificar instalación en `%AppData%/KeyLaunch/games/`
8. [ ] Ejecutar juego
9. [ ] Enviar comentario al creador
10. [ ] Creador recibe email (si Resend configurado)

## Flujo revocación (5 min)

1. [ ] Creador revoca activación del tester
2. [ ] Tester intenta ejecutar → mensaje "Acceso revocado"
3. [ ] Tester no puede descargar nueva versión

## Métricas a monitorizar

- Uso de R2 (alerta al 80% de 10 GB)
- Consultas VT diarias (máx. 500)
- Emails Resend (máx. 100/día)
- Tamaño BD Supabase (máx. 500 MB)

## Feedback a recoger

- Tiempo de escaneo VT aceptable?
- UX del launcher clara?
- ¿SmartScreen bloquea el launcher? (documentar workaround)
- ¿Tamaño límite 2 GB suficiente?
