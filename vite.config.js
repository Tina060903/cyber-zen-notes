import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/cyber-zen-notes/' : '/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
