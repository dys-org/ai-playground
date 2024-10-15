import 'dotenv/config';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { csrf } from 'hono/csrf';

import youtube from './routes/youtube.js';

const app = new Hono();
app.use(csrf());

// Serve static files from the 'dist' directory
app.use('/*', serveStatic({ root: './dist/client' }));

const api = new Hono();
api.route('/summarizeYoutube', youtube);

const routes = app.route('/api', api);

// Catch-all route for client-side routing
app.get('*', (c) => c.html('./dist/client/index.html'));

const port = 3000;

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server is running on port ${port}`);

export default app;
export type AppType = typeof routes;
