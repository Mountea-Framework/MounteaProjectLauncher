import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';

export default defineConfig({
  base: './', // file:// loading in packaged app
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
  plugins: [
    {
      // Chromium refuses module scripts over file://, so the packaged page must load a classic script.
      name: 'classic-script-for-file-protocol',
      apply: 'build',
      transformIndexHtml(html) {
        // defer keeps the script running after #root is parsed, as module scripts did
        return html.replace(/<script type="module" crossorigin src=/g, '<script defer src=');
      },
    },
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        // Electron 33's ESM loader fails on `import ... from "electron"`; main must be CJS.
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: false,
            rollupOptions: {
              input: 'electron/main.ts',
              output: { format: 'cjs', entryFileNames: 'main.cjs' },
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart: (o) => o.reload(),
        // Sandboxed preloads must be CJS; package.json "type": "module" would otherwise emit ESM.
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: false,
            rollupOptions: {
              input: 'electron/preload.ts',
              output: { format: 'cjs', entryFileNames: 'preload.cjs' },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
});
