import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'UniGuide Gabès',
    short_name: 'UniGuide',
    description: 'Interactive student map: useful places for students in Gabès',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#1d4ed8',
    lang: 'fr',
    categories: ['education', 'navigation', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Add a place', short_name: 'Add', url: '/submit', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'My account', short_name: 'Account', url: '/account', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
