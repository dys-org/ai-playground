import { createRouter, createWebHistory } from 'vue-router';

import YoutubeView from './views/YoutubeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'youtube',
      component: YoutubeView,
    },
    // {
    //   path: '/youtube',
    //   name: 'youtube',
    //   component: () => import('../views/YoutubeView.vue'),
    // },
  ],
});

export default router;
