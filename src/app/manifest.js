export default function manifest() {
  return {
    name: 'Inzeedo POS',
    short_name: 'Inzeedo POS',
    description: 'Inzeedo Point of Sale Developed By: Inzeedo',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}