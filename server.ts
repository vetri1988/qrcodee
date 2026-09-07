import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Global Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // REST API Routes FIRST
  app.use('/api', apiRouter);

  // Fallback for API 404
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API route ${req.method} ${req.originalUrl} not found.` });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Resolve dist folder whether running from bundle in dist/ or from workspace root
    let distPath = typeof __dirname !== 'undefined' ? __dirname : path.join(process.cwd(), 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      const altPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(path.join(altPath, 'index.html'))) {
        distPath = altPath;
      }
    }

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATM Sensor Label Manager] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
