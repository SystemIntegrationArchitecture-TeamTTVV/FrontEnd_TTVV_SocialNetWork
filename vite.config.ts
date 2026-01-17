import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [  tailwindcss(),react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfill for Node.js 'global' variable in browser
      global: 'globalThis',
    },
  },
})
