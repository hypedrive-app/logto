import { webcrypto } from 'node:crypto';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18next.use(initReactI18next).init({
  // Simple resources for testing
  resources: { en: { translation: { admin_console: { general: { add: 'Add' } } } } },
  lng: 'en',
  react: { useSuspense: false },
});

// jsdom does not provide `crypto.subtle`; polyfill it from Node's WebCrypto.
if (!globalThis.crypto?.subtle) {
  // eslint-disable-next-line @silverhand/fp/no-mutation, @typescript-eslint/no-unsafe-member-access, no-restricted-syntax
  (globalThis as { crypto: Crypto }).crypto = webcrypto as unknown as Crypto;
}
