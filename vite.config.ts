import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'public',
  server: {
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': 'http://localhost:3000',
      '/proxy': 'http://localhost:3000',
      '/bare': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
