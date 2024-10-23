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
