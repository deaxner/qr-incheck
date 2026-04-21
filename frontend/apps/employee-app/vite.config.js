import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const appRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: resolve(appRoot, 'dist')
  },
  test: {
    environment: 'jsdom',
    setupFiles: resolve(appRoot, '../../shared/test/setup.js')
  }
});
