# Wireframes — KeyLaunch

Descripción de pantallas para implementación. No son diseños visuales finales.

## Portal creador (web)

### 1. Login / Landing creador
- Logo KeyLaunch + tagline.
- Botón "Iniciar sesión con Google".
- Enlace a descarga del launcher (para jugadores).

### 2. Dashboard — Mis proyectos
- Lista de tarjetas: nombre, versiones, activaciones activas, almacenamiento usado.
- Botón "Nuevo proyecto".
- Barra de uso: X/3 proyectos, Y/6 GB.

### 3. Detalle de proyecto
- Tabs: **Versiones** | **Claves** | **Activaciones** | **Ajustes**.
- Header: nombre, descripción, icono, ruta del ejecutable.

### 4. Tab Versiones
- Tabla: v#, fecha, tamaño, estado escaneo (pending/clean/infected), toggles:
  - "Seleccionable por jugadores"
  - "Versión recomendada"
- Botón "Subir nueva versión" → modal con drag-and-drop ZIP.

### 5. Tab Claves
- Input: cantidad a generar (1–50).
- Botón "Generar claves".
- Tabla: código (parcialmente oculto), estado (disponible/usada/revocada), fecha.
- Acciones: copiar, revocar.

### 6. Tab Activaciones
- Tabla: alias dispositivo, clave usada, fecha activación, versión instalada, estado.
- Botón "Revocar acceso" por fila.

---

## Launcher (escritorio)

### 1. Activación de clave
- Campo clave: `XXXXX-XXXXX-XXXXX`.
- Campo alias: pre-rellenado con hostname (`DESKTOP-XXX`).
- Botón "Activar".
- Enlace opcional: "Iniciar sesión con Google" (guardar claves).

### 2. Biblioteca
- Sidebar: proyectos activados (icono + nombre).
- Panel principal: proyecto seleccionado.
  - Estado: no descargado / descargando X% / instalado vN.
  - Botones: **Descargar/Actualizar**, **Jugar**, **Comentar**.

### 3. Pantalla Jugar
- Selector de versión (dropdown, solo versiones seleccionables).
- Badge "Recomendada" en la latest.
- Botón grande **Ejecutar**.
- Ruta local del ejecutable (solo lectura).

### 4. Comentarios
- Textarea + selector de versión opcional.
- Botón "Enviar al creador".
- Mensaje de confirmación o rate limit.

---

## Landing pública

### Página principal
- Hero: "Distribuye builds como Steam, gratis."
- Secciones: Para creadores | Para jugadores | Límites gratuitos.
- CTAs: "Crear proyecto" | "Descargar launcher".
- Footer: ToS, Privacidad, GitHub.
