<script setup lang="ts">
import { InferResponseType } from 'hono';
import MarkdownIt from 'markdown-it';
import { ref } from 'vue';

import CopyButton from '@/components/CopyButton.vue';
import Spinner from '@/components/Spinner.vue';
import { client } from '@/lib/client';

const md: MarkdownIt = new MarkdownIt();

const $post = client.api.summarizePdf.$post;
type ResponseType200 = InferResponseType<typeof $post, 200>;

const file = ref<File>();
const summaryResponse = ref<ResponseType200>();
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
  if (file.value.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB. Please upload a smaller file.');
    return;
  }
  const formData = new FormData(e.target as HTMLFormElement);

  isLoading.value = true;
  error.value = '';
  summaryResponse.value = undefined;

  try {
    // Hono client doesn't support file upload yet 😢
    // so we use fetch directly and type the json response
    const resp = await fetch('/api/summarizePdf', {
      method: 'POST',
      body: formData,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text);
    }
    const json: ResponseType200 = await resp.json();
    summaryResponse.value = json;
    // TODO clear file input
  } catch (err: any) {
    error.value = err;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-4 pb-24 text-center">
    <h1 class="my-8 inline-flex items-center gap-3 text-4xl font-semibold">
      <span class="i-lucide-file size-10" />
      PDF Summarizer
    </h1>
    <form @submit.prevent="uploadPdf" class="mx-auto mb-8 grid max-w-lg gap-4">
      <label class="sr-only" for="pdfFile">PDF File</label>
      <input
        type="file"
        @change="handleFileChange"
        accept=".pdf"
        class="mx-auto block w-full cursor-pointer rounded-md border border-gray-5 bg-gray-1/40 p-2 file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-9 disabled:cursor-not-allowed disabled:opacity-50"
        id="pdfFile"
        name="pdf"
        required
      />
      <button
        type="submit"
        class="mt-4 justify-self-center rounded bg-primary-9 px-3 py-2 font-semibold text-white transition hover:bg-primary-9/90"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Processing...' : 'Upload and Summarize' }}
      </button>
    </form>

    <p v-if="error" class="mb-4 text-red-500">{{ error }}</p>

    <Spinner v-if="isLoading" role="status" />

    <div v-if="summaryResponse" class="relative rounded-lg bg-primary-3/60 p-6 pb-8 text-left">
      <h2 class="mb-4 text-2xl font-semibold">Summary</h2>
      <p class="chat-message text-lg leading-relaxed" v-html="md.render(summaryResponse.summary)" />

      <table class="mt-6 text-xs">
        <tbody>
          <tr>
            <th class="py-1 pr-2 font-normal">Pages Submitted</th>
            <td class="px-2 py-1">{{ summaryResponse.metadata.totalPages }}</td>
          </tr>
          <tr>
            <th class="py-1 pr-2 font-normal">Chunks Processed</th>
            <td class="px-2 py-1">{{ summaryResponse.metadata.chunksProcessed }}</td>
          </tr>
        </tbody>
      </table>
      <CopyButton
        :summary="summaryResponse.summary"
        class="absolute right-4 top-8 -translate-y-1/2"
      />
    </div>
  </div>
</template>
