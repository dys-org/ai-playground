import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = new Hono();
app.use('*', cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/summarize', async (c) => {
  const { url } = await c.req.json();

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const fullText = transcript.map((item) => item.text).join(' ');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes YouTube lecture transcripts.',
        },
        {
          role: 'user',
          content: `Please provide a concise summary of the following lecture transcript:\n\n${fullText}`,
        },
      ],
      max_tokens: 300,
    });

    const summary = response.choices[0].message.content;

    return c.json({ summary });
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: 'Failed to summarize the lecture' }, 500);
  }
});

const port = 3000;

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server is running on port ${port}`);
