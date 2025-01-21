import { createOpenAI } from '@ai-sdk/openai';
import { zValidator } from '@hono/zod-validator';
import { generateText } from 'ai';
import { Hono } from 'hono';
import { Document } from 'mupdf';
import { z } from 'zod';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_CHARACTERS_PER_CHUNK: 12000,
  MAX_CHUNKS_ALLOWED: 40,
  OVERLAP: 500,
} as const;

export async function chunkPDF(file: File) {
  // Read the file as a buffer
  const arrayBuffer = await file.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);
  // Extract text from PDF using mupdf
  const doc = Document.openDocument(pdfBuffer, 'application/pdf');
  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < doc.countPages(); i++) {
    const page = doc.loadPage(i);
    try {
      const text = page.toStructuredText('preserve-whitespace').asText();
      currentChunk += text + '\n';
      if (currentChunk.length >= CONFIG.MAX_CHARACTERS_PER_CHUNK) {
        // Find the last period to create a natural break
        const lastPeriodIndex = currentChunk.lastIndexOf('.', CONFIG.MAX_CHARACTERS_PER_CHUNK);
        const breakIndex =
          lastPeriodIndex > 0 ? lastPeriodIndex + 1 : CONFIG.MAX_CHARACTERS_PER_CHUNK;

        chunks.push(currentChunk.slice(0, breakIndex));

        // Keep the overlap for context
        currentChunk = currentChunk.slice(Math.max(0, breakIndex - CONFIG.OVERLAP));
      }
    } catch (err) {
      console.error(`Error extracting text from page ${i + 1}:`, err);
    }
  }

  // Add any remaining text as the final chunk
  if (currentChunk) chunks.push(currentChunk);

  return { chunks, totalPages: doc.countPages() };
}

export async function summarizeChunks(chunks: string[], imageInterpretations?: string[]) {
  const CONTENT_SEPARATOR = '\n\n';

  // Summarize each chunk
  const chunkSummaries = await Promise.all(chunks.map((chunk) => summarizeSingleChunk(chunk)));

  // If single chunk and no images, return directly
  if (chunkSummaries.length === 1 && !imageInterpretations?.length) {
    return chunkSummaries[0];
  }

  // Combine all content before final summarization
  const combinedContent = [
    chunkSummaries.join(CONTENT_SEPARATOR),
    imageInterpretations?.length
      ? `Visual Content: ${imageInterpretations.join(CONTENT_SEPARATOR)}`
      : '',
  ]
    .filter(Boolean)
    .join(CONTENT_SEPARATOR);

  return summarizeSingleChunk(combinedContent);
}

async function summarizeSingleChunk(text: string) {
  const { text: summary } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: text,
    system: 'Summarize the following text concisely while retaining key information.',
    maxTokens: 1024,
    temperature: 0.2,
  });

  return summary;
}

const pdfUploadSchema = z.object({
  pdf: z
    .instanceof(File)
    .refine((file) => file.size !== 0 || file.size <= CONFIG.MAX_FILE_SIZE, 'Max file size is 5MB.')
    .refine((file) => file.type === 'application/pdf', 'Only .pdf files are supported'),
});

const pdf = new Hono().post(
  '/',
  zValidator('form', pdfUploadSchema, (result, c) => {
    if (!result.success) {
      console.log(result.error);
      return c.text(result.error.issues[0].message, 400);
    }
  }),
  async (c) => {
    const formData = await c.req.formData();
    const file = formData.get('pdf') as File;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);
      const doc = Document.openDocument(pdfBuffer, 'application/pdf');

      const [{ chunks, totalPages }, images] = await Promise.all([
        chunkPDF(file),
        extractImages(doc),
      ]);

      if (chunks.length > CONFIG.MAX_CHUNKS_ALLOWED) {
        return c.text(
          `Document too large: ${chunks.length} chunks exceed maximum of ${CONFIG.MAX_CHUNKS_ALLOWED}`,
          413,
        );
      }

      const imageInterpretations = await Promise.all(images.map(interpretImage));
      const summary = await summarizeChunks(chunks, imageInterpretations);

      return c.json({
        summary,
        images: images.map((data, index) => ({
          data,
          interpretation: imageInterpretations[index],
        })),
        metadata: {
          totalPages,
          chunksProcessed: chunks.length,
          imagesExtracted: images.length,
        },
      });
    } catch (err) {
      console.error('Error processing PDF:', err);
      return c.text(`Failed to process PDF: ${err}`, 500);
    }
  },
);

export default pdf;

async function extractImages(doc: Document) {
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

async function interpretImage(imageBase64: string) {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe this image in detail, focusing on its content and any text visible in it.',
          },
          { type: 'image', image: imageBase64 },
        ],
      },
    ],
    maxTokens: 1024,
    temperature: 0.2,
  });
  return text;
}
