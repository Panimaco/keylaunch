export default function PrivacyPage() {
  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Política de privacidad</h1>
      <p>Última actualización: julio 2026</p>

      <h2>Datos que recopilamos</h2>
      <h3>Creadores (cuenta Google)</h3>
      <ul>
        <li>Email, nombre e imagen de perfil de Google</li>
        <li>Proyectos, versiones y claves que creas</li>
      </ul>

      <h3>Jugadores (sin cuenta obligatoria)</h3>
      <ul>
        <li>Alias del dispositivo (ej. DESKTOP-XXX) — proporcionado por el jugador</li>
        <li>Huella de dispositivo (hash generado localmente)</li>
        <li>Comentarios enviados a creadores</li>
      </ul>

      <h2>Datos que NO recopilamos</h2>
      <ul>
        <li>Contenido de los juegos ejecutados localmente</li>
        <li>Datos de ubicación</li>
        <li>Información de pago (el servicio es gratuito)</li>
      </ul>

      <h2>Almacenamiento</h2>
      <p>
        Los metadatos se almacenan en Supabase (PostgreSQL). Las builds se almacenan
        en Cloudflare R2. Los comentarios se reenvían por email al creador vía Resend.
      </p>

      <h2>Escaneo antivirus</h2>
      <p>
        Los hashes SHA-256 de las builds se envían a VirusTotal para análisis.
        VirusTotal puede retener hashes según su propia política.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes solicitar la eliminación de tu cuenta de creador contactando vía GitHub Issues.
        Los jugadores pueden desinstalar el launcher y borrar datos locales en cualquier momento.
      </p>
    </div>
  );
}
