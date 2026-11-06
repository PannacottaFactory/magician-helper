import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// VITE_BASE_PATH = "/" (custom domain, local dev); "/<repo>/" on a github.io project site.
// VITE_SITE_URL = public address of the site (canonical links, Open Graph, sitemap).
export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || 'https://magicianhelper.com/').replace(/\/?$/, '/')
  return {
    base: env.VITE_BASE_PATH || '/',
    define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl) },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
      },
      // Installable app (PWA). The app shell is cached for fast start; Supabase
      // data is never cached by the service worker (always fresh and private).
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Magician Helper',
          short_name: 'Magician Helper',
          description: 'Repertoire, routines, practice, gigs and props for professional magicians.',
          lang: 'en',
          theme_color: '#0e0e0f',
          background_color: '#0e0e0f',
          display: 'standalone',
          orientation: 'any',
          start_url: '.',
          scope: '.',
          categories: ['productivity', 'business', 'entertainment'],
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Practice log', url: 'app/practice', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Gigs', url: 'app/gigs', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // the PDF library is large and only needed when generating a PDF (fetched on demand)
          globIgnores: ['**/react-pdf*.js'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // font files only (the Google Fonts stylesheet goes straight to the network)
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      rollupOptions: {
        output: {
          // Split big vendor libraries into their own cacheable files (browser build only;
          // the server build used by scripts/prerender.mjs keeps them external)
          manualChunks: isSsrBuild ? undefined : {
            react: ['react', 'react-dom', 'react-router'],
            supabase: ['@supabase/supabase-js'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            query: ['@tanstack/react-query'],
            ui: ['radix-ui', 'cmdk', 'sonner', 'lucide-react'],
          },
        },
      },
    },
  }
})
