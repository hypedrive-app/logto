import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

// A dedicated Vitest config — it intentionally avoids the app build pipeline (mdx, compression,
// manualChunks) in `vite.config.ts` and only wires up what tests need: React + SVGR transforms,
// the `@/` alias, CSS-module stubbing, and a jsdom environment for component tests.

// Absolute, OS-native path to `src`. Use `fileURLToPath`, not `URL#pathname`: the latter keeps
// percent-encoding (e.g. a space in a parent dir becomes `%20`), producing a path that doesn't
// exist on disk and breaking every `@/` import resolution at test time.
const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    // Mirror the app's alias shape from vite.shared.config (`find: /^@\//`, slash-terminated
    // replacement), anchored to this package's absolute `src`.
    alias: [{ find: /^@\//, replacement: `${srcDir}/` }],
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
    // Pin the jsdom document URL so `window.location.origin` is deterministic across
    // jsdom versions (newer jsdom defaults to `http://localhost:3000/`, which broke
    // tests that assert origin-relative URLs like the invitation accept link).
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
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
