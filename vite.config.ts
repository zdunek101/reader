/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serwuje aplikację pod /<repo>/, więc wszystkie zasoby muszą mieć ten prefiks.
export default defineConfig({
  base: '/reader/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'worker/**/*.test.ts'],
  },
});
