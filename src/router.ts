import { createRouter, createWebHistory } from 'vue-router';

// import PdfSummarizerView from './views/PdfSummarizerView.vue';
import YoutubeView from './views/YoutubeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'youtube',
      component: YoutubeView,
    },
    {
      path: '/pdf-summarizer',
      name: 'pdfSummarizer',
      component: () => import('./views/PdfSummarizerView.vue'),
    },
  ],
});

export default router;
