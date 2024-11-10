import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

function createStore() {
  return {
    vectorStore: new MemoryVectorStore(embeddings),
  };
}

let store = createStore();

// For testing purposes
export function resetStore() {
  store = createStore();
}

export async function addDocuments(texts: string[]) {
  const docs = texts.map((text) => ({
    pageContent: text,
    metadata: { source: 'uploaded-document' },
  }));
  await store.vectorStore.addDocuments(docs);
}

export async function query(question: string) {
  return store.vectorStore.similaritySearch(question, 4);
}

export async function generateAnswer(question: string, context: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `
You are a helpful assistant. Answer the question based on the provided context.
Always prioritize the provided context in your answers.
If the provided context doesn't cover a topic, rely on your general knowledge but clearly state when you are doing so.
Admit if you are unsure about something and suggest where to find more information.
`,
      },
      {
        role: 'user',
        content: `Context: ${context}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.2,
  });

  return completion.choices[0].message.content ?? '';
}
