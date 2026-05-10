import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/ — vitest/config gộp cấu hình test
export default defineConfig({
  plugins: [tailwindcss(), react()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: false,
    clearMocks: true,
  },
})
