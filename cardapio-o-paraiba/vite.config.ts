import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two static pages: the menu itself (/) and the printable QR table card (/mesa.html).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mesa: resolve(__dirname, 'mesa.html'),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
