import type { Metadata, Viewport } from 'next';
// fontes guardadas no próprio site (sem chamar o Google a cada visita)
import '@fontsource-variable/sora';
import '@fontsource-variable/figtree';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import { MARCA } from '@/lib/marca';

export const metadata: Metadata = {
  title: { default: `${MARCA.nome} · ${MARCA.slogan}`, template: `%s · ${MARCA.nome}` },
  description: MARCA.descricao,
  icons: { icon: '/img/icone-120.png', apple: '/img/icone-120.png' },
};

export const viewport: Viewport = {
  themeColor: '#071A3D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
