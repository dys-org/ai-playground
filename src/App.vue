<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { RouterLink } from 'vue-router';

const aiModel = useStorage('ai-model', 'gpt-4o-mini');
</script>

<template>
  <header class="flex h-14 items-center justify-between gap-4 px-4">
    <nav class="flex items-center gap-4 sm:gap-8">
      <RouterLink
        to="/"
        class="flex-shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-primary-9"
      >
        <img src="@/assets/img/ai.svg" alt="A.I. logo" class="h-8" />
      </RouterLink>
      <RouterLink
        to="/youtube"
        class="text-white transition-colors hover:text-white/80 focus-visible:outline-primary-9"
        active-class="border-b-2 border-primary-9 -mb-0.5"
      >
        YouTube
      </RouterLink>
      <RouterLink
        to="/pdf-summarizer"
        class="whitespace-nowrap text-white transition-colors hover:text-white/80 focus-visible:outline-primary-9"
        active-class="border-b-2 border-primary-9 -mb-0.5"
      >
        PDF Summarizer
      </RouterLink>
      <RouterLink
        to="/rag"
        class="text-white transition-colors hover:text-white/80 focus-visible:outline-primary-9"
        active-class="border-b-2 border-primary-9 -mb-0.5"
      >
        RAG
      </RouterLink>
    </nav>
    <div class="justify-self-end">
      <select
        v-model="aiModel"
        class="select h-auto w-28 truncate border-transparent bg-transparent px-2 py-1 pr-6 hover:bg-gray-2"
        aria-label="Model"
      >
        <option value="gpt-4o">GPT-4o</option>
        <option value="gpt-4o-mini">GPT-4o mini</option>
        <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
      </select>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style>
.chat-message {
  ul,
  ol {
    list-style: revert;
    margin: revert;
    padding: revert;
    @apply mb-4 pl-4;
  }

  p:not(:last-child) {
    margin-bottom: 1rem;
  }
  h2 {
    @apply text-2xl font-bold;
  }
  h3 {
    @apply text-xl font-bold;
  }
}
</style>
