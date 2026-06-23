import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

// A dedicated Vitest config — it intentionally avoids the app build pipeline (mdx, compression,
// manualChunks) in `vite.config.ts` and only wires up what tests need: React + SVGR transforms,
// the `@/` alias, CSS-module stubbing, and a jsdom environment for component tests.
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
  css: {
    // Stub CSS modules so `styles.foo` resolves to the class name (mirrors `identity-obj-proxy`).
    modules: {
      generateScopedName: '[local]',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        // These ESM-only packages must be transformed for the test runtime.
        inline: [/nanoid/, /jose/, /ky/, /@logto/, /@silverhand/],
      },
    },
  },
});
