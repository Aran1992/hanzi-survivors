import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hanzi-survivors/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
