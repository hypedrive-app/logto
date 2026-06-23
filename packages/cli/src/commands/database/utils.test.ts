import { createPrivateKey } from 'node:crypto';

import { SupportedSigningKeyAlgorithm } from '@logto/schemas';
import { describe, expect, it } from 'vitest';

import { generateOidcPrivateKey } from './utils.js';

describe('generateOidcPrivateKey', () => {
  it.each([
    [SupportedSigningKeyAlgorithm.RSA, 'RSA'],
    [SupportedSigningKeyAlgorithm.EC, 'EC'],
    [SupportedSigningKeyAlgorithm.EdDSA, 'OKP'],
  ] as const)('generates a usable %s key exported as JWK kty %s', async (type, expectedKty) => {
    const key = await generateOidcPrivateKey(type);

    expect(key.id).toEqual(expect.any(String));
    expect(key.value).toContain('PRIVATE KEY');

    // The PEM must be a valid key whose JWK type matches the requested algorithm — this is what the
    // OIDC provider relies on to pick the signing JWA (Ed25519 → OKP → `EdDSA`).
    const jwk = createPrivateKey(key.value).export({ format: 'jwk' });
    expect(jwk.kty).toBe(expectedKty);

    if (type === SupportedSigningKeyAlgorithm.EdDSA) {
      expect(jwk.crv).toBe('Ed25519');
    }
  });
});
