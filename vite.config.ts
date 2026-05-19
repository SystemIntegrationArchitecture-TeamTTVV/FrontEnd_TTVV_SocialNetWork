import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/ — vitest/config gộp cấu hình test
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5311,
    proxy: {
      // Proxy all API calls to the local API Gateway in dev.
      // This avoids hard-coding http://localhost:8088 in the browser (breaks on phones/other machines).
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: false,
    clearMocks: true,
  },
})
