import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const name = 'By Império Dog';
  const short_name = 'Imperio Dog';
  const theme_color = '#052e2b';
  const background_color = '#ffffff';

  return {
    name,
    short_name,
    description: 'Spitz Alemão Anão — filhotes legítimos, criação responsável e acompanhamento premium.',
    start_url: '/',
    display: 'standalone',
    theme_color,
    background_color,
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  };
}
