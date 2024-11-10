<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <header class="flex h-14 items-center justify-between px-8">
    <RouterLink to="/" class="text-white transition-colors hover:text-white/80">
      A.I. Playground
    </RouterLink>
    <nav class="flex items-center gap-8">
      <RouterLink
        to="/youtube"
        class="text-white transition-colors hover:text-white/80"
        active-class="border-b-2 border-primary-9 -mb-0.5"
      >
        YouTube
      </RouterLink>
      <RouterLink
        to="/pdf-summarizer"
        class="text-white transition-colors hover:text-white/80"
        active-class="border-b-2 border-primary-9 -mb-0.5"
      >
        PDF Summarizer
      </RouterLink>
      <RouterLink
        to="/rag"
        class="text-white transition-colors hover:text-white/80"
        active-class="border-b-2 border-primary-9 -mb-0.5"
      >
        RAG
      </RouterLink>
    </nav>
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
