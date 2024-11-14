import { Hono } from 'hono';
import { Document } from 'mupdf';

import { addDocuments, generateAnswer, query } from '../services/vectorStore.js';

const rag = new Hono()
  .post('/upload', async (c) => {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) return c.text('No file uploaded', 400);

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
      } else if (file.type === 'application/json') {
        const json = JSON.parse(buffer.toString());
        texts = Array.isArray(json) ? json : [JSON.stringify(json)];
      } else if (file.type === 'text/markdown') {
        texts = [buffer.toString()];
      } else {
        return c.text('Unsupported file type', 400);
      }

      await addDocuments(texts);
      return c.json({ success: true, documentsAdded: texts.length });
    } catch (err) {
      console.error(err);
      return c.text('Error processing file', 500);
    }
  })
  .post('/query', async (c) => {
    const { question } = await c.req.json();

    if (!question) return c.text('No question provided', 400);

    try {
      const relevantDocs = await query(question);
      const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
      const answer = await generateAnswer(question, context);

      return c.json({ answer });
    } catch (err) {
      console.error(err);
      return c.text('Error processing query', 500);
    }
  });

export default rag;
