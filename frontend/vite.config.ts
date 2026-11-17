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
      // "@shared/..." zeigt auf den Ordner shared/ neben frontend/ und backend/
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    // Vite liefert aus Sicherheitsgründen nur Dateien aus dem eigenen Ordner aus.
    // shared/ liegt eine Ebene höher, also erlauben wir den Projektordner.
    fs: {
      allow: ['..'],
    },
    // Proxy: Alle Anfragen an /api leitet Vite an das Backend weiter.
    // Das Frontend fragt also nur "/api/..." an, ohne Port und ohne Host.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
