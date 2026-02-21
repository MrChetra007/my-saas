import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173, // your dev server port
    allowedHosts: [
      'nonemploying-towery-chang.ngrok-free.dev', // your ngrok URL
    ],
    // ⚡ Optional for dynamic URLs:
    // allowedHosts: 'all'
  },
})
