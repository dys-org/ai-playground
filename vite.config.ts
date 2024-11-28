import { URL, fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import tailwind from 'tailwindcss';
import nesting from 'tailwindcss/nesting';
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    postcss: {
      plugins: [nesting(), tailwind(), autoprefixer()],
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: './dist/client',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
