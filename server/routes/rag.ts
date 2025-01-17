import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Document } from 'mupdf';
import { z } from 'zod';

import { modelEnum } from '../../lib/types.js';
import { addDocuments, generateAnswer, query } from '../services/vectorStore.js';

const ragQuerySchema = z.object({
  question: z.string(),
  model: modelEnum,
});

const ragUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => ['application/pdf', 'application/json', 'text/markdown'].includes(file.type),
      'Only .pdf, .json, and .md formats are supported',
    ),
});

const rag = new Hono()
  .post(
    '/upload',
    zValidator('form', ragUploadSchema, (result, c) => {
      if (!result.success) {
        console.log(result.error);
        return c.text(result.error.issues[0].message, 400);
      }
    }),
    async (c) => {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let texts: string[] = [];

        if (file.type === 'application/pdf') {
          const doc = Document.openDocument(buffer, 'application/pdf');
          for (let i = 0; i < doc.countPages(); i++) {
            const page = doc.loadPage(i);
            const text = page.toStructuredText().asText();
            texts.push(text);
          }
        }
        if (file.type === 'application/json') {
          const json = JSON.parse(buffer.toString());
          texts = Array.isArray(json) ? json : [JSON.stringify(json)];
        }
        if (file.type === 'text/markdown') {
          texts = [buffer.toString()];
        }

        await addDocuments(texts);
        return c.json({ success: true, documentsAdded: texts.length });
      } catch (err) {
        console.error(err);
        return c.text('Error processing file', 500);
      }
    },
  )
  .post(
    '/query',
    zValidator('json', ragQuerySchema, (result, c) => {
      if (!result.success) {
        console.log(result.error);
        return c.text(result.error.issues[0].message, 400);
      }
    }),
    async (c) => {
      const { question } = c.req.valid('json');

      try {
        const relevantDocs = await query(question);
        const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
        const answer = await generateAnswer(question, context);

        return c.json({ answer });
      } catch (err) {
        console.error(err);
        return c.text('Error processing query', 500);
      }
    },
  );

export default rag;
