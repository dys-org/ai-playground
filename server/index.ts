import 'dotenv/config';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { csrf } from 'hono/csrf';

import pdfSummarizer from './routes/pdfSummarizer.js';
import youtube from './routes/youtube.js';

const app = new Hono();

// Apply CSRF protection to all routes except /api/summarizePdf
app.use('*', async (c, next) => {
  if (c.req.path !== '/api/summarizePdf') {
    return csrf()(c, next);
  }
  await next();
});

const api = new Hono().route('/summarizeYoutube', youtube).route('/summarizePdf', pdfSummarizer);

const routes = app.route('/api', api);

// Serve static files from the 'dist' directory
app.use('/*', serveStatic({ root: './dist/client' }));
// Catch-all route to serve index.html for any unmatched routes
app.use('*', serveStatic({ path: './dist/client/index.html' }));

const port = 3000;

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server is running on port ${port}`);

export default app;
export type AppType = typeof routes;
