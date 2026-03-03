import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Workout Timer',
    short_name: 'Workout Timer',
    description: 'Build interval workouts and run a guided timer experience.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0f12',
    theme_color: '#0c0f12',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  } as MetadataRoute.Manifest
}
