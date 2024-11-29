import { Hono } from 'hono';
import { Document } from 'mupdf';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Summarize the following text concisely while retaining key information.',
      },
      { role: 'user', content: text },
    ],
    max_tokens: 1024,
    temperature: 0.2,
  });

  return completion.choices[0].message.content ?? '';
}

const pdf = new Hono().post('/', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('pdf') as File | null;

  if (!file) return c.text('No file uploaded', 400);

  if (file.size > CONFIG.MAX_FILE_SIZE) {
    return c.text(`File size exceeds ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`, 413);
  }

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
});

export default pdf;

async function extractImages(doc: Document): Promise<string[]> {
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
