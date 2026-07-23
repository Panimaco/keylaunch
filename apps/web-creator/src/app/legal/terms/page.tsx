export default function TermsPage() {
  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Términos de uso</h1>
      <p>Última actualización: julio 2026</p>

      <h2>1. Naturaleza del servicio</h2>
      <p>
        KeyLaunch es una plataforma comunitaria gratuita que proporciona infraestructura
        para que creadores distribuyan builds de software a testers autorizados mediante
        claves de activación.
      </p>

      <h2>2. Responsabilidad del creador</h2>
      <p>
        El creador es el único responsable del contenido que sube, incluyendo la legalidad,
        licencias y seguridad de sus builds. KeyLaunch no revisa manualmente el contenido
        más allá del escaneo automatizado con VirusTotal.
      </p>

      <h2>3. Responsabilidad del jugador/tester</h2>
      <p>
        Al activar una clave, el jugador acepta ejecutar software de terceros bajo su
        propio riesgo. Las claves son de un solo uso y deben tratarse como credenciales
        confidenciales.
      </p>

      <h2>4. Límites del servicio</h2>
      <p>
        El servicio se ofrece &quot;tal cual&quot; dentro de los límites documentados en
        docs/LIMITS.md. No garantizamos disponibilidad continua ni almacenamiento permanente.
      </p>

      <h2>5. Revocación</h2>
      <p>
        Los creadores pueden revocar claves y activaciones en cualquier momento.
        KeyLaunch se reserva el derecho de suspender proyectos que violen estos términos.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Para consultas, abre un issue en el repositorio de GitHub del proyecto.
      </p>
    </div>
  );
}
