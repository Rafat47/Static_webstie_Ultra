import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.META_PIXEL_ID': JSON.stringify(process.env.META_PIXEL_ID || ''),
    'import.meta.env.VITE_META_PIXEL_ID': JSON.stringify(process.env.META_PIXEL_ID || '')
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || '.', './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    allowedHosts: [
      'nonsolar-hyperpyretic-marylin.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
