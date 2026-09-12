import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Tikerino',
        short_name: 'Tikerino',
        description:
          'Learn to read markets one tiny principle at a time. Practice charts are generated, not real market data.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAFAF7',
        // Brand green as the OS accent. In-app, text never sits on this colour
        // in white - see the tokens file.
        theme_color: '#10B981',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The lesson shell - app code, fonts, the sanitised content pack - is
        // precached so onboarding, the path and lesson cards work offline.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // Exercise windows are deliberately NOT cached: candles come from the
        // server, which is the only place that knows where the cut point is.
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // The design tokens and the spec pack live above the client root.
    fs: { allow: [resolve(__dirname, '..')] },
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
  build: { target: 'es2022', sourcemap: true },
});
