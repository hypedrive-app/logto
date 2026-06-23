import {
  ApplicationType,
  LogtoOidcConfigKeyType,
  OidcSigningKeyStatus,
  SupportedSigningKeyAlgorithm,
} from '@logto/schemas';
import { appendPath } from '@silverhand/essentials';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { oidcApi } from '#src/api/api.js';
import {
  createApplication,
  createResource,
  deleteApplication,
  deleteResource,
  rotateOidcKeys,
} from '#src/api/index.js';
import { logtoUrl } from '#src/constants.js';

describe('OIDC signing-key algorithms', () => {
  // Restore the default EC key after the suite so a non-EC key never leaks into other suites.
  afterAll(async () => {
    await rotateOidcKeys(LogtoOidcConfigKeyType.PrivateKeys, SupportedSigningKeyAlgorithm.EC);
  });

  it('should rotate to an EdDSA (Ed25519) key and issue tokens that verify against the JWKS', async () => {
    // End-to-end check: rotating to an Ed25519 key must make the provider actually sign tokens with
    // the `EdDSA` JWA so they verify against the published JWKS. This guards the `jwkSigningAlg`
    // mapping in `core/src/env-set/oidc.ts` — if the algorithm doesn't follow the key type, signing
    // silently falls back to `RS256` and verification fails.
    const rotated = await rotateOidcKeys(
      LogtoOidcConfigKeyType.PrivateKeys,
      SupportedSigningKeyAlgorithm.EdDSA
    );
    const current = rotated.find(({ status }) => status === OidcSigningKeyStatus.Current);
    expect(current?.signingKeyAlgorithm).toBe(SupportedSigningKeyAlgorithm.EdDSA);

    // A resource indicator is required so the token is issued as a (signed) JWT rather than opaque.
    const client = await createApplication('eddsa signing test', ApplicationType.MachineToMachine);
    const resource = await createResource();
    try {
      const { access_token: accessToken } = await oidcApi
        .post('token', {
          body: new URLSearchParams({
            client_id: client.id,
            client_secret: client.secret,
            grant_type: 'client_credentials',
            resource: resource.indicator,
          }),
        })
        .json<{ access_token: string }>();

      const { protectedHeader } = await jwtVerify(
        accessToken,
        createRemoteJWKSet(appendPath(new URL(logtoUrl), 'oidc/jwks'))
      );
      expect(protectedHeader.alg).toBe('EdDSA');
    } finally {
      await deleteApplication(client.id);
      await deleteResource(resource.id);
    }
  });
});
