import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import legacy from '@vitejs/plugin-legacy';

// A LG 43UN7300 roda webOS 5 (Chromium 68): o build gera código e polyfills compatíveis.
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    legacy({ targets: ['chrome >= 68'], renderModernChunks: false }),
  ],
  build: { outDir: 'dist', assetsInlineLimit: 0 },
  test: { environment: 'jsdom' },
} as never);
