import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for the experience app.
 *
 * Auth flows are short-lived and data is request-scoped (a consent screen, a passkey
 * challenge), so we disable background refetching and retries by default — a failed
 * interaction request should surface immediately, not silently retry. Individual queries
 * can opt back into retries where it makes sense.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      // Interaction state changes server-side between steps, so don't serve stale data.
      staleTime: 0,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Centralized, typed query keys so cache entries are consistent and easy to invalidate.
 * Add new keys here rather than inlining string arrays at call sites.
 */
export const queryKeys = Object.freeze({
  consentInfo: ['consent-info'] as const,
  passkeyRegistrationOptions: ['passkey-registration-options'] as const,
});
