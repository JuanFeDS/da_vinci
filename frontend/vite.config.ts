import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isTauri = process.env.TAURI_ENV_DEBUG !== undefined

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: {
    target: isTauri ? ['es2021', 'chrome105', 'safari13'] : 'es2022',
    sourcemap: isTauri,
  },
})
