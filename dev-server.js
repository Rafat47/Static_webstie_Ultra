import app from './netlify/functions/app.js';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

// If production build exists, serve static assets for local production testing
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // In Express 5, wildcard fallback is handled via middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Hair Care E-Commerce Server running on port ${PORT}`);
  console.log(`📡 Local API endpoint: http://localhost:${PORT}/api`);
  if (fs.existsSync(distPath)) {
    console.log(`🌐 Production Frontend: http://localhost:${PORT}/`);
  }
  console.log(`=======================================================`);
});

