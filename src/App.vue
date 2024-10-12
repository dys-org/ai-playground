<script setup lang="ts">
import { ref } from 'vue';

type Summary = { summary: string };

const youtubeUrl = ref('');
const summary = ref('');
const isLoading = ref(false);
const error = ref('');

async function summarizeLecture() {
  if (!youtubeUrl.value) {
    error.value = 'Please enter a YouTube URL';
    return;
  }

  isLoading.value = true;
  error.value = '';
  summary.value = '';

  try {
    const resp = await fetch('/api/summarize', {
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
</script>

<template>
  <div class="container">
    <h1>YouTube Lecture Summarizer</h1>
    <div class="input-container">
      <input v-model="youtubeUrl" placeholder="Enter YouTube URL" />
      <button @click="summarizeLecture" :disabled="isLoading">Summarize</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="isLoading" class="loading">Summarizing...</div>
    <div v-if="summary" class="summary">
      <h2>Summary:</h2>
      <p>{{ summary }}</p>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.input-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

input {
  width: 60%;
  padding: 0.5rem;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error {
  color: red;
}

.loading {
  font-style: italic;
}

.summary {
  text-align: left;
  margin-top: 2rem;
}
</style>
