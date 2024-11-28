<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { computed, ref } from 'vue';

import CopyButton from '@/components/CopyButton.vue';
import Spinner from '@/components/Spinner.vue';
import { useQueryMutation, useUploadMutation } from '@/lib/mutations';

const md = new MarkdownIt();
const question = ref('');

const uploadMutation = useUploadMutation({
  onSuccess: () => {
    setTimeout(() => uploadMutation.reset(), 5000);
  },
});

const queryMutation = useQueryMutation({
  onSuccess: () => {
    question.value = '';
  },
});

const shouldDisable = computed(
  () => uploadMutation.isPending.value || queryMutation.isPending.value,
);

async function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;

  const file = target.files[0];
  if (file.size > 10 * 1024 * 1024) {
    alert('File size exceeds 10MB. Please upload a smaller file.');
    return;
  }

  uploadMutation.mutate(file);
  target.value = '';
}

async function handleSubmit() {
  if (!question.value.trim()) return;
  queryMutation.mutate(question.value);
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
          class="input mx-auto w-full cursor-pointer file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
          :disabled="shouldDisable"
        />
        <div v-if="uploadMutation.isPending.value" class="mt-3 flex items-center gap-2 text-sm">
          <Spinner class="size-4" />Uploading...
        </div>

        <div v-else-if="uploadMutation.isError.value" class="mt-3 text-sm text-red-500">
          {{ uploadMutation.error.value?.message }}
        </div>

        <div
          v-else-if="uploadMutation.isSuccess.value"
          class="mt-3 flex items-center gap-2 text-sm"
        >
          Upload successful. {{ uploadMutation.data.value?.documentsAdded }} document(s) added to
          the pipeline.
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
            class="input w-full rounded-r-none"
          />
          <button :disabled="shouldDisable" class="btn btn-primary rounded-l-none">
            <span class="sr-only">Send</span>
            <span class="i-lucide-send-horizontal size-5"></span>
          </button>
        </div>
        <div v-if="queryMutation.isPending.value" class="mt-3 flex items-center gap-2 text-sm">
          <Spinner class="size-4" />
          Thinking...
        </div>
        <div v-else-if="queryMutation.isError.value" class="mt-3 text-sm text-red-500">
          {{ queryMutation.error.value?.message }}
        </div>
      </form>
    </div>

    <div
      v-if="queryMutation.isSuccess.value"
      class="relative rounded-lg bg-primary-3/60 p-6 pb-3 text-left"
    >
      <div class="prose" v-html="md.render(queryMutation.data.value?.answer ?? '')"></div>
      <CopyButton :content="queryMutation.data.value?.answer ?? ''" class="mt-4" />
    </div>
  </div>
</template>
