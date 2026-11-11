import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'V-TRY | Brand Merchant Portal',
    short_name: 'Brand Portal',
    description: 'Merchant dashboard for clothing brands, apparel inventory, and AI Virtual Try-On pipelines.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
