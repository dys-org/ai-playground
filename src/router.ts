import { createRouter, createWebHistory } from 'vue-router';

import HomeView from './views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/youtube',
      name: 'youtube',
      component: () => import('./views/YoutubeView.vue'),
    },
    {
      path: '/pdf-summarizer',
      name: 'pdfSummarizer',
      component: () => import('./views/PdfSummarizerView.vue'),
    },
    {
      path: '/rag',
      name: 'rag',
      component: () => import('./views/RagView.vue'),
    },
  ],
});

export default router;
