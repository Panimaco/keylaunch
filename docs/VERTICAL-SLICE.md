# Vertical slice — validación end-to-end

Este documento describe el **slice mínimo** que valida el 80% del riesgo técnico del proyecto.

## Qué valida

```
Creador sube ZIP → VirusTotal escanea → genera 1 clave → jugador activa → descarga → ejecuta
```

## Pasos automatizables

### 1. Preparar build de prueba

Crea un ZIP mínimo con un ejecutable:

```powershell
mkdir test-build\bin
echo '@echo off' > test-build\bin\game.bat
echo 'echo Hello KeyLaunch' >> test-build\bin\game.bat
Compress-Archive -Path test-build\* -DestinationPath test-build.zip
```

Ruta ejecutable en el proyecto: `bin/game.bat`

### 2. Portal creador

1. Login Google → `/dashboard`
2. Crear proyecto "Test Slice"
3. Subir `test-build.zip`
4. Trigger scan queue (curl arriba)
5. Cuando `clean`: generar 1 clave

### 3. Launcher

1. `cd apps/launcher && npm run tauri dev`
2. Activar clave
3. Descargar v1
4. Ejecutar

### 4. Verificaciones

| Paso | Esperado |
|------|----------|
| Subida | ZIP en R2, versión `pending_scan` |
| Escaneo | Estado `clean`, VT report URL |
| Clave | Formato `XXXXX-XXXXX-XXXXX`, status `available` |
| Activación | Status `used`, activación `active` |
| Descarga | SHA-256 coincide, archivos en AppData |
| Ejecutar | Proceso lanzado sin error |
| Revocar | Launcher bloquea ejecución |

## API directa (sin UI)

Útil para depurar backend sin frontend:

```bash
# Activar clave
curl -X POST "$SUPABASE_URL/functions/v1/activate-key" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"code":"YOUR-KEY","device_name":"TEST-PC","device_fingerprint":"abc123"}'

# Check access
curl -X POST "$SUPABASE_URL/functions/v1/check-access" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"activation_id":"UUID","device_fingerprint":"abc123"}'

# Download URL
curl -X POST "$SUPABASE_URL/functions/v1/get-download-url" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"activation_id":"UUID","version_id":"UUID","device_fingerprint":"abc123"}'
```

## Criterio de éxito

El vertical slice está **completo** cuando un creador puede subir un ZIP, obtener una clave limpia, y un jugador puede activarla, descargar y ejecutar en Windows sin intervención manual en la base de datos.
