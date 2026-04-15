import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, 'dist')
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
});
