import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE_PATH = "/magician-helper/" on GitHub Pages, "/" locally or with a custom domain.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      rollupOptions: {
        output: {
          // Split big vendor libraries into their own cacheable files
          manualChunks: {
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
