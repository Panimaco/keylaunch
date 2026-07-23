# Generar iconos del launcher

Tauri requiere iconos en `apps/launcher/src-tauri/icons/`.

1. Crea un PNG de 1024×1024 con el logo de KeyLaunch.
2. Ejecuta desde `apps/launcher`:

```bash
npm run tauri icon path/to/icon.png
```

Esto genera todos los tamaños necesarios (32x32, 128x128, icon.ico, icon.icns).

## Updater

Para habilitar auto-update:

```bash
npm run tauri signer generate -w ~/.tauri/keylaunch.key
```

Copia la clave pública a `tauri.conf.json` → `plugins.updater.pubkey`.

Actualiza `latest.json` en cada release con la firma del bundle.
