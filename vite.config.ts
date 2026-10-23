import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://lakinduboteju.github.io/daana/
  base: '/daana/',
  plugins: [react()],
})
