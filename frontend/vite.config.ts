import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      // "@/..." zeigt auf frontend/src
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Proxy: Alle Anfragen an /api leitet Vite an das Backend weiter.
    // Das Frontend fragt also nur "/api/..." an, ohne Port und ohne Host.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
