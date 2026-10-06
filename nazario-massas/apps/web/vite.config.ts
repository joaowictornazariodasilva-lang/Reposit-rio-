import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:8787';
/** `VITE_DEMO=1`: self-contained build (API simulated in the browser), served from a relative base. */
const DEMO = process.env.VITE_DEMO === '1';
const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: DEMO ? './' : '/',
  resolve: {
    alias: [
      { find: /^@\/demo\/install$/, replacement: src(DEMO ? 'demo/install.ts' : 'demo/install-stub.ts') },
      ...(DEMO ? [{ find: /^node:crypto$/, replacement: src('demo/crypto-shim.ts') }] : []),
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Keep the browser's Host header so the API's same-origin (CSRF) check sees the real origin.
      '/api': { target: API_TARGET, changeOrigin: false },
      '/uploads': { target: API_TARGET, changeOrigin: false },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      // Keep the browser's Host header so the API's same-origin (CSRF) check sees the real origin.
      '/api': { target: API_TARGET, changeOrigin: false },
      '/uploads': { target: API_TARGET, changeOrigin: false },
    },
  },
  build: {
    target: 'es2022',
    outDir: DEMO ? 'dist-demo' : 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: app deploys don't invalidate the framework cache.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler|react-router|cookie|set-cookie-parser)\//.test(id)) return 'react';
          if (/node_modules\/zod\//.test(id)) return 'zod';
        },
      },
    },
  },
});
