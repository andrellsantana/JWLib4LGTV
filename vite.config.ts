import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

/*
 * A LG 43UN7300 roda webOS 5 (Chromium 68). O app vira um único script clássico
 * (app.js) + app.css, sem módulos ES: assim ele pode ser carregado tanto da
 * pasta do app na TV quanto, por texto, a partir do GitHub Pages (atualização
 * automática, ver loader/index.html).
 */
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    {
      name: 'classic-script',
      enforce: 'post',
      transformIndexHtml(html: string) {
        return html
          .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '')
          .replace('</body>', '  <script src="./app.js"></script>\n</body>')
          .replace(/ crossorigin/g, '');
      },
    },
  ],
  esbuild: { target: 'chrome68' },
  build: {
    outDir: 'dist/app',
    target: 'chrome68',
    cssTarget: 'chrome68',
    assetsInlineLimit: 0,
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: (a: { name?: string }) => (a.name && a.name.endsWith('.css') ? 'app.css' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
  test: { environment: 'jsdom' },
} as never);
