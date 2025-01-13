import { createOpenAI } from '@ai-sdk/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { generateText } from 'ai';
import pg from 'pg';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function createVectorStore() {
  // Initialize pgvector extension and create table if not exists
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

  return PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: {
      connectionString: process.env.DATABASE_URL,
    },
    tableName: 'documents', // Default table name
  });
}

// Initialize store
const vectorStore = await createVectorStore();

export async function addDocuments(texts: string[]) {
  const docs = texts.map((text) => ({
    pageContent: text,
    metadata: { source: 'uploaded-document' },
  }));
  await vectorStore.addDocuments(docs);
}

export async function query(question: string) {
  return vectorStore.similaritySearch(question, 4);
}

export async function generateAnswer(question: string, context: string) {
  const { text: completion } = await generateText({
    model: openai('gpt-4o-mini'),
    system: `
You are a helpful assistant. Answer the question based on the provided context.
Always prioritize the provided context in your answers.
If the provided context doesn't cover a topic, rely on your general knowledge but clearly state when you are doing so.
Admit if you are unsure about something and suggest where to find more information.
`,
    prompt: `Context: ${context}\n\nQuestion: ${question}`,
    temperature: 0.2,
  });

  return completion;
}
