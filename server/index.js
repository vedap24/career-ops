/**
 * server/index.js — Express server entry point
 *
 * Mounts API routes, serves static frontend, handles errors.
 * Designed to work locally with SQLite and be compatible
 * with Vercel serverless deployment later.
 */

import 'dotenv/config';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import route modules
import jobsRouter from './routes/jobs.js';
import evaluateRouter from './routes/evaluate.js';
import resumeRouter from './routes/resume.js';
import profileRouter from './routes/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────────────

// Parse JSON bodies (limit 5MB for large JD text)
app.use(express.json({ limit: '5mb' }));

// Serve static frontend files
app.use(express.static(join(__dirname, '..', 'public')));

// ─── API Routes ─────────────────────────────────────────────────────

app.use('/api/jobs', jobsRouter);
app.use('/api/jobs', evaluateRouter);   // Nested: /api/jobs/:id/evaluate
app.use('/api/jobs', resumeRouter);     // Nested: /api/jobs/:id/resume
app.use('/api/profile', profileRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    gemini_configured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

// ─── SPA Fallback ───────────────────────────────────────────────────
// All non-API routes serve index.html for client-side routing

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// ─── Error Handler ──────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server (local only — Vercel uses the export) ─────────────

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║         career-ops MVP — Local Server            ║
╠══════════════════════════════════════════════════╣
║  🌐  http://localhost:${PORT}                      ║
║  📡  API: http://localhost:${PORT}/api              ║
║  ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? '🤖  Gemini: configured ✓' : '⚠️   Gemini: not configured (eval disabled)'}             ║
╚══════════════════════════════════════════════════╝
    `);
  });
}

// Export for Vercel serverless
export default app;
