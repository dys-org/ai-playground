<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { ref } from 'vue';

import CopyButton from '@/components/CopyButton.vue';
import Spinner from '@/components/Spinner.vue';

const md: MarkdownIt = new MarkdownIt();

const file = ref<File | null>(null);
const summary = ref<string>('');
const isLoading = ref(false);
const error = ref('');

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    file.value = target.files[0];
    error.value = ''; // Clear any previous errors
  }
}

async function uploadPdf(e: Event) {
  if (!file.value) return;
  const formData = new FormData(e.target as HTMLFormElement);
  console.log(Object.fromEntries(formData));

  isLoading.value = true;
  error.value = '';
  summary.value = '';

  try {
    const resp = await fetch('/api/summarizePdf', {
      method: 'POST',
      body: formData,
    });

    if (!resp.ok) {
      if (resp.status === 403) {
        throw new Error('Access denied. Please try refreshing the page.');
      } else {
        throw new Error('Failed to upload and summarize PDF. Please try again.');
      }
    }

    const json = await resp.json();
    if (json.error) {
      throw new Error(json.error);
    }
    summary.value = json.summary;
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'An unexpected error occurred. Please try again.';
    }
    console.error('Error:', err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl p-4 pb-24">
    <h1 class="my-8 inline-flex items-center gap-3 text-4xl font-semibold">PDF Summarizer</h1>
    <form @submit.prevent="uploadPdf" class="mx-auto mb-8 grid gap-4">
      <label class="sr-only" for="pdfFile">PDF File</label>
      <input
        type="file"
        @change="handleFileChange"
        accept=".pdf"
        class="mx-auto block w-full rounded-md border border-gray-5 bg-gray-1/40 p-2 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-9 disabled:cursor-not-allowed disabled:opacity-50"
        id="pdfFile"
        name="pdf"
        required
      />
      <label for="chunkText" class="flex items-center gap-2 text-sm">
        <input type="checkbox" id="chunkText" name="chunkText" />
        <span class="font-semibold">Chunk text</span>
        <span class="block text-gray-11">
          Splits text into chunks of 5000 characters for processing.
        </span>
      </label>
      <button
        type="submit"
        class="mt-6 justify-self-start rounded bg-primary-9 px-3 py-2 font-semibold text-white"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Processing...' : 'Upload and Summarize' }}
      </button>
    </form>

    <p v-if="error" class="mb-4 text-red-500">{{ error }}</p>

    <Spinner v-if="isLoading" role="status" />

    <div v-if="summary" class="mt-4 text-left">
      <h2 class="mb-4 text-2xl font-semibold">Summary</h2>
      <p class="chat-message text-lg leading-relaxed" v-html="md.render(summary)" />
      <CopyButton :summary="summary" />
    </div>
  </div>
</template>
