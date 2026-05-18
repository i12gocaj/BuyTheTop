import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BuyTheTop - Premium Ranking Platform',
    short_name: 'BuyTheTop',
    description: 'Premium ranking platform where monetary contributions determine your position at the top',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#c9a96e',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['entertainment', 'games', 'social'],
    lang: 'en',
    dir: 'ltr',
  }
}
