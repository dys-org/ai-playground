<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { ref } from 'vue';

import { sleep } from './lib/utils';

type Summary = { summary: string };

const md: MarkdownIt = new MarkdownIt();

const youtubeUrl = ref('');
const summary = ref('');
const isLoading = ref(false);
const error = ref('');
const isCopying = ref(false);

async function summarizeLecture() {
  isLoading.value = true;
  error.value = '';
  summary.value = '';

  try {
    const resp = await fetch('/api/summarizeYoutube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl.value }),
    });
    if (!resp.ok) throw resp;
    const json = (await resp.json()) as Summary;
    summary.value = json.summary;
  } catch (err) {
    error.value = 'An error occurred while summarizing the lecture';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

async function handleCopy(content: string) {
  if (isCopying.value) return;
  try {
    await navigator.clipboard.writeText(content);
    isCopying.value = true;
    await sleep(1500);
  } catch (err) {
    console.error('Failed to copy: ', err);
  } finally {
    isCopying.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-4 pb-24 text-center">
    <h1 class="my-8 inline-flex items-center gap-3 text-4xl font-semibold">
      <span class="i-logos-youtube-icon size-12" />Video Summarizer
    </h1>

    <form @submit.prevent="summarizeLecture" class="mb-12 flex justify-center gap-1">
      <label for="youtubeUrl" class="sr-only">YouTube URL</label>

      <input
        v-model="youtubeUrl"
        id="youtubeUrl"
        placeholder="Enter a YouTube URL"
        type="url"
        pattern="(http:|https:)?(\/\/)?(www\.)?(youtube.com|youtu.be)\/(watch|embed)?(\?v=|\/)?(\S+)?"
        required
        class="w-2/3 rounded-l-md border border-gray-5 bg-gray-1/40 p-2 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-9 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <button
        :disabled="isLoading"
        class="rounded-r-md bg-primary-9 px-3 py-2 font-semibold text-white transition-colors hover:bg-primary-9/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-9 disabled:pointer-events-none disabled:opacity-50"
      >
        Summarize
      </button>
    </form>

    <p v-if="error" class="mb-4 text-red-500">{{ error }}</p>

    <div v-if="isLoading" role="status" class="flex justify-center">
      <svg
        aria-hidden="true"
        class="size-12 animate-spin fill-primary-9 text-gray-6"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span class="sr-only">Summarizing...</span>
    </div>

    <div v-if="summary" class="relative rounded-lg bg-primary-3/60 p-6 pb-8 text-left">
      <!-- <h2 class="mb-4 text-xl font-semibold">Summary:</h2> -->
      <p class="chat-message text-lg leading-relaxed" v-html="md.render(summary)" />
      <button
        class="absolute right-4 top-8 -translate-y-1/2 bg-transparent p-1 text-white/60 hover:text-white"
        title="Copy Summary"
        @click="handleCopy(summary)"
      >
        <span class="sr-only">{{ isCopying ? 'Copied' : 'Copy' }}</span>
        <span
          v-if="isCopying"
          class="i-lucide-copy-check size-5 text-green-400"
          aria-hidden="true"
        ></span>
        <span v-else class="i-lucide-book-copy size-5" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<style>
.chat-message ul,
.chat-message ol {
  list-style: revert;
  margin: revert;
  padding: revert;
  @apply mb-4 pl-4;
}

.chat-message P:not(:last-child) {
  margin-bottom: 1rem;
}
</style>
