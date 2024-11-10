import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class VectorStore {
  private store: MemoryVectorStore;
  private embeddings: OpenAIEmbeddings;
  private static instance: VectorStore;

  private constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.store = new MemoryVectorStore(this.embeddings);
  }

  static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  async addDocuments(texts: string[], metadata: Record<string, any>[] = []) {
    const documents = texts.map((text, i) => {
      return new Document({
        pageContent: text,
        metadata: metadata[i] || {},
      });
    });
    await this.store.addDocuments(documents);
  }

  async query(question: string, k = 3) {
    const results = await this.store.similaritySearch(question, k);
    return results;
  }

  async generateAnswer(question: string, context: string) {
    const resp = await openai.chat.completions.create({
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

    return resp.choices[0].message.content ?? '';
  }
}
