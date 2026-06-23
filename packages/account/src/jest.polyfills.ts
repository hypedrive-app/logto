/**
 * Runs via Jest's `setupFiles` — i.e. before the test framework and, crucially, before
 * `jest.setup.ts`'s own module imports are evaluated.
 *
 * `ky` v2 references `TextEncoder`/`TextDecoder` at module-load time. The jsdom test environment
 * does not expose them as globals, so they must be polyfilled here — earlier than any import that
 * transitively loads `ky` (e.g. `@logto/schemas`).
 */
import { TextEncoder, TextDecoder } from 'node:util';

if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @silverhand/fp/no-mutation, no-restricted-syntax
  (globalThis as { TextEncoder: unknown }).TextEncoder = TextEncoder;
  // eslint-disable-next-line @silverhand/fp/no-mutation, no-restricted-syntax
  (globalThis as { TextDecoder: unknown }).TextDecoder = TextDecoder;
}
