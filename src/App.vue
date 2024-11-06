<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <header class="flex items-center justify-end gap-8 p-4">
    <RouterLink to="/" class="text-white transition-colors hover:text-white/80">YouTube</RouterLink>
    <RouterLink to="/pdf-summarizer" class="text-white transition-colors hover:text-white/80">
      PDF Summarizer
    </RouterLink>
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
