import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

// In local dev and preview, serve the single website-data.json from netlify/functions/data/
function serveNetlifyFunctionDataPlugin() {
  const handler = (req, res, next) => {
    const url = req.url || '';
    if (
      url.startsWith('/api/website-data') ||
      url.startsWith('/api/content') ||
      url.startsWith('/data/website-data.json')
    ) {
      const filePath = path.resolve(import.meta.dirname || '.', 'netlify/functions/data/website-data.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.end(data);
        return;
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          success: false,
          message: 'website-data.json not found in netlify/functions/data/. Run "npm run fetch:content" or "npm run build" to fetch from MongoDB.'
        }));
        return;
      }
    }
    next();
  };

  return {
    name: 'serve-netlify-function-data',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), serveNetlifyFunctionDataPlugin()],
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
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
