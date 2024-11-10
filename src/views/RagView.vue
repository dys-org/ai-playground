<script setup lang="ts">
import { InferResponseType } from 'hono';
import MarkdownIt from 'markdown-it';
import { computed, ref } from 'vue';

import CopyButton from '@/components/CopyButton.vue';
import Spinner from '@/components/Spinner.vue';
import { client } from '@/lib/client';

const md = new MarkdownIt();

const $uploadPost = client.api.rag.upload.$post;
type UploadPost200 = InferResponseType<typeof $uploadPost, 200>;

const question = ref('');
const answer = ref('');
const isUploading = ref(false);
const isAsking = ref(false);
const error = ref('');
const uploadResult = ref<UploadPost200>();

const shouldDisable = computed(() => isAsking.value || isUploading.value);

async function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;
  isUploading.value = true;

  const file = target.files[0];
  if (file.size > 10 * 1024 * 1024) {
    alert('File size exceeds 10MB. Please upload a smaller file.');
    return;
  }
  const formData = new FormData();
  formData.append('file', file);

  try {
    const resp = await fetch('/api/rag/upload', {
      method: 'POST',
      body: formData,
    });

    if (!resp.ok) throw new Error(await resp.text());

    const result: UploadPost200 = await resp.json();
    console.log('Upload successful:', result);
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
    }
    console.error(err);
  } finally {
    isUploading.value = false;
  }
}

async function handleSubmit() {
  if (!question.value.trim()) return;

  isAsking.value = true;
  error.value = '';

  try {
    const resp = await client.api.rag.query.$post({ json: { question: question.value } });

    if (!resp.ok) throw new Error(await resp.text());

    const json = await resp.json();
    answer.value = json.answer;
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
    }
    console.error(err);
  } finally {
    isAsking.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-4 pb-24">
    <h1 class="my-8 inline-flex w-full items-center justify-center gap-3 text-4xl font-semibold">
      <span class="i-lucide-file-archive size-10" />
      RAG Pipeline
    </h1>

    <div class="mt-6 grid gap-8">
      <div class="min-h-32">
        <label for="fileUpload" class="mb-2 block text-sm">
          <span class="font-semibold">Upload a document</span>
          <p class="text-gray-11">Accepts PDF, JSON, or Markdown files.</p>
        </label>
        <input
          id="fileUpload"
          type="file"
          @change="handleFileUpload"
          accept=".pdf,.json,.md"
          class="mx-auto block w-full cursor-pointer rounded-md border border-gray-5 bg-gray-1/40 p-2 file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-9 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="shouldDisable"
        />
        <div v-if="isUploading" class="mt-3 flex items-center gap-2 text-sm">
          <Spinner class="size-4" />
          Uploading...
        </div>

        <!-- TODO put this in a toast -->
        <div v-if="uploadResult" class="mt-3 flex items-center gap-2 text-sm">
          Upload successful. {{ uploadResult?.documentsAdded }} document(s) added to the pipeline.
        </div>
      </div>
      <form @submit.prevent="handleSubmit" class="min-h-28">
        <label for="askQuestion" class="mb-2 block text-sm font-semibold">
          Ask a question about your documents
        </label>
        <div class="flex justify-center gap-1">
          <input
            id="askQuestion"
            v-model="question"
            type="text"
            class="w-full rounded-l-md border border-gray-5 bg-gray-1/40 p-2 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-9 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            :disabled="shouldDisable"
            class="inline-flex items-center gap-2 rounded-r-md bg-primary-9 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-9/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-9 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span class="sr-only">Send</span>
            <span class="i-lucide-send-horizontal size-5"></span>
          </button>
        </div>
        <div v-if="isAsking" class="mt-3 flex items-center gap-2 text-sm">
          <Spinner class="size-4" />
          Thinking...
        </div>
      </form>
    </div>

    <div v-if="error" class="mb-4 text-red-500">{{ error }}</div>

    <div v-if="answer" class="relative rounded-lg bg-primary-3/60 p-6 pb-3 text-left">
      <div class="prose" v-html="md.render(answer)"></div>
      <CopyButton :content="answer" class="mt-4" />
    </div>
  </div>
</template>
