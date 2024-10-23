<script setup lang="ts">
import { ref } from 'vue';

import { sleep } from '@/lib/utils';

const props = defineProps<{
  summary: string;
}>();

const isCopying = ref(false);

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
  <button
    class="absolute right-4 top-8 -translate-y-1/2 bg-transparent p-1 text-white/60 hover:text-white"
    title="Copy Summary"
    @click="handleCopy(props.summary)"
  >
    <span class="sr-only">{{ isCopying ? 'Copied' : 'Copy' }}</span>
    <span
      v-if="isCopying"
      class="i-lucide-copy-check size-5 text-green-400"
      aria-hidden="true"
    ></span>
    <span v-else class="i-lucide-book-copy size-5" aria-hidden="true"></span>
  </button>
</template>
