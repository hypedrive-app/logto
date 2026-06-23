/** @fileoverview The common config for frontend projects. */

import { UserConfig } from 'vite';

/**
 * Minimal structural shape of the chunking meta this helper relies on. Typed against
 * just `getModuleInfo(...).importedIds` rather than a specific bundler's `GetManualChunk`,
 * so it stays compatible across Vite 6 (Rollup) and Vite 8 (Rolldown), whose nominal
 * `ModuleInfo`/`GetModuleInfo` types differ.
 */
type ChunkMeta = {
  getModuleInfo: (moduleId: string) => { importedIds: readonly string[] } | null | undefined;
};

export const manualChunks = (id: string, { getModuleInfo }: ChunkMeta): string | undefined => {
  const hasReactDependency = (id: string): boolean => {
    return getModuleInfo(id)
      ?.importedIds
      .some((importedId) =>
        importedId.includes('react') ||
        importedId.includes('react-dom')
      ) ?? false;
  }

  // Caution: React-related packages should be bundled together otherwise it will cause runtime errors
  if (id.includes('/node_modules/') && hasReactDependency(id)) {
    return 'react';
  }

  if (id.includes('/@logto/')) {
    return '@logto';
  }

  if (id.includes('/node_modules/')) {
    return 'vendors';
  }

  const match = /\/lib\/locales\/([^/]+)/.exec(id);
  if (match?.[1]) {
    return `phrases-${match[1]}`;
  }
};

export const defaultConfig: UserConfig = {
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: '/src/',
      },
    ],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: { manualChunks },
    },
  },
};
