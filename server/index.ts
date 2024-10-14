import 'dotenv/config';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { csrf } from 'hono/csrf';

import youtube from './routes/youtube.js';

const app = new Hono();
app.use(csrf());

const api = new Hono();
api.route('/summarizeYoutube', youtube);

const routes = app.route('/api', api);

const port = 3000;

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server is running on port ${port}`);

export default app;
export type AppType = typeof routes;
