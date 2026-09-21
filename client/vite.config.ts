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
        // Narration audio is precached too: a narrated lesson must play fully
        // offline, same as the text one.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,mp3}'],
        // Exercise windows are deliberately NOT cached: candles come from the
        // server, which is the only place that knows where the cut point is.
        navigateFallback: 'index.html',
        // Never let the learner shell capture the private server-owned /ops route.
        // This is also the upgrade path for clients that installed an older root SW.
        navigateFallbackDenylist: [/^\/ops(?:\/|$)/],
        importScripts: ['root-sw-upgrade.js'],
        runtimeCaching: [
          {
            // iOS Safari fetches media with Range requests; without the
            // range plugin a precached 200 can fail its media loader.
            urlPattern: /\/audio\//,
            handler: 'CacheFirst',
            options: { cacheName: 'narration-audio', rangeRequests: true },
          },
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
    // Bind IPv4 loopback explicitly. Vite's default is the name "localhost",
    // which Node resolves verbatim - on a host whose resolver answers ::1 first
    // (CI runners do) the dev server binds only to [::1] and everything in this
    // repo that addresses 127.0.0.1 - the proxy target below, the browser
    // suites, curl health checks - gets connection refused against a server the
    // log says is ready.
    host: '127.0.0.1',
    // The design tokens and the spec pack live above the client root.
    fs: { allow: [resolve(__dirname, '..')] },
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
  build: { target: 'es2022', sourcemap: true },
});
