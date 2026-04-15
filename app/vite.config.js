import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, 'public/ui'),
    rollupOptions: {
      input: resolve(__dirname, 'assets/app.jsx'),
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'app.css';
          }

          return 'assets/[name][extname]';
        },
        chunkFileNames: 'chunks/[name].js',
        entryFileNames: 'app.js'
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './assets/test/setup.js'
  }
});
