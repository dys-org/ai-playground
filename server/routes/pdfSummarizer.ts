import os from 'node:os';
import path from 'node:path';

import fs from 'fs-extra';
import { Hono } from 'hono';
import * as mupdf from 'mupdf';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getSummary(chunk: string) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Your task is to summarize the provided text.',
      },
      { role: 'user', content: chunk },
    ],
  });
  return resp.choices[0].message.content;
}

async function extractImages(doc: mupdf.Document): Promise<string[]> {
  const images: string[] = [];
  for (let i = 0; i < doc.countPages(); i++) {
    const page = doc.loadPage(i);
    page.toStructuredText('preserve-images').walk({
      onImageBlock(bbox, transform, image) {
        const pixmap = image.toPixmap();
        const pngData = pixmap.asPNG();
        const base64Image = Buffer.from(pngData).toString('base64');
        images.push(`data:image/png;base64,${base64Image}`);
      },
    });
  }
  return images;
}

async function interpretImage(imageBase64: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe this image in detail, focusing on its content and any text visible in it.',
          },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      },
    ],
  });
  return response.choices[0].message.content || '';
}

const pdf = new Hono().post('/', async (c) => {
  const formData = await c.req.formData();
  // console.log(formData);
  const file = formData.get('pdf') as File | null;
  const chunkText = formData.get('chunkText') || false;
  if (!file) {
    return c.text('No file uploaded', 400);
  }

  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, file.name);

  try {
    // Write the uploaded file to disk
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    // Read the file as a buffer
    const pdfBuffer = await fs.readFile(filePath);
    // Extract text and images from PDF using mupdf
    const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
    let pdfText = '';
    for (let i = 0; i < doc.countPages(); i++) {
      const page = doc.loadPage(i);
      try {
        const text = page.toStructuredText('preserve-whitespace').asText();
        pdfText += text + '\n';
      } catch (err) {
        console.error(`Error extracting text from page ${i + 1}:`, err);
      }
    }
    // return if no text was added to pdfText
    if (!pdfText) {
      return c.text('No text was extracted from the PDF', 500);
    }

    // Extract images
    const images = await extractImages(doc);

    // Interpret images
    const imageInterpretations = await Promise.all(images.map(interpretImage));

    // Combine text and image interpretations
    const fullContent =
      pdfText + '\n\nImage Interpretations:\n' + imageInterpretations.join('\n\n');

    // If chunkText is not checked, process the entire content with OpenAI
    if (!chunkText) {
      const summary = await getSummary(fullContent);
      return c.json({ summary });
    }

    // Split text into chunks of 5000 characters
    const chunks = fullContent.match(/.{1,5000}/g) || [];

    // Process each chunk with OpenAI
    const summaries = await Promise.all(chunks.map(async (chunk) => getSummary(chunk)));

    // Combine summaries
    const finalSummary = summaries.join('\n\n');
    return c.json({ summary: finalSummary });
  } catch (err) {
    console.error('Error processing PDF:', err);
    if (err instanceof Error) {
      return c.text(`Error processing PDF: ${err.message}`, 500);
    }
    return c.text('An unexpected error occurred while processing the PDF', 500);
  } finally {
    // Clean up the temporary file
    await fs.remove(filePath).catch((err) => {
      console.error('Error removing temporary file:', err);
    });
  }
});

export default pdf;
