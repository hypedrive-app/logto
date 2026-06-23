import react from '@vitejs/plugin-react';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { defineConfig, mergeConfig, type UserConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';

import { defaultConfig, manualChunks } from '../../vite.shared.config';

const buildConfig = (mode: string): UserConfig => ({
  server: {
    port: 5001,
    hmr: { port: 6001 },
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/oidc': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    svgr(),
    viteCompression({ disable: mode === 'development' }),
    viteCompression({ disable: mode === 'development', algorithm: 'brotliCompress' }),
  ],
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV,
      DEV_FEATURES_ENABLED: process.env.DEV_FEATURES_ENABLED,
    },
  },
  build: {
    target: browserslistToEsbuild('> 0.5%, last 2 versions, Firefox ESR, not dead'),
    rollupOptions: {
      output: {
        manualChunks: (id, meta) => {
          if (/\/node_modules\/i18next[^/]*\//.test(id)) return 'i18next';
          for (const largePackage of ['libphonenumber-js', 'core-js']) {
            if (id.includes(`/node_modules/${largePackage}/`)) return largePackage;
          }
          return manualChunks(id, { getModuleInfo: meta.getModuleInfo });
        },
      },
    },
  },
});

export default defineConfig(({ mode }) => mergeConfig(defaultConfig, buildConfig(mode)));
