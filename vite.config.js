import { defineConfig } from 'vite';

export default defineConfig({
  base: '/cyber-zen-notes/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
