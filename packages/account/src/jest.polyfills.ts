/**
 * Runs via Jest's `setupFiles` — i.e. before the test framework and, crucially, before
 * `jest.setup.ts`'s own module imports are evaluated.
 *
 * `ky` v2 references `TextEncoder`/`TextDecoder` at module-load time. The jsdom test environment
 * does not expose them as globals, so they must be polyfilled here — earlier than any import that
 * transitively loads `ky` (e.g. `@logto/schemas`).
 */
// This polyfill runs before jsdom provides the globals, so it must require them from node:util.
// eslint-disable-next-line n/prefer-global/text-encoder, n/prefer-global/text-decoder
import { TextEncoder, TextDecoder } from 'node:util';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- jsdom types it as defined, runtime doesn't
if (globalThis.TextEncoder === undefined) {
  // eslint-disable-next-line @silverhand/fp/no-mutation, no-restricted-syntax
  (globalThis as { TextEncoder: unknown }).TextEncoder = TextEncoder;
  // eslint-disable-next-line @silverhand/fp/no-mutation, no-restricted-syntax
  (globalThis as { TextDecoder: unknown }).TextDecoder = TextDecoder;
}
