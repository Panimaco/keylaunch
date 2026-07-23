import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KeyLaunch — Distribuye builds gratis',
  description: 'Plataforma comunitaria para distribuir builds con claves revocables, estilo Steam.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
