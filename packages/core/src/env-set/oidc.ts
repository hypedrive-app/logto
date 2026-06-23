import crypto from 'node:crypto';

import type { LogtoOidcConfigType } from '@logto/schemas';
import {
  LogtoOidcConfigKey,
  getCurrentOidcPrivateKey,
  getOidcProviderPrivateKeys,
} from '@logto/schemas';
import { conditional } from '@silverhand/essentials';
import { createLocalJWKSet } from 'jose';

import { getOidcProviderPublicJwks } from '#src/libraries/oidc-private-key.js';
import { exportJWK } from '#src/utils/jwks.js';

const loadOidcValues = async (issuer: string, configs: LogtoOidcConfigType) => {
  const cookieKeys = configs[LogtoOidcConfigKey.CookieKeys].map(({ value }) => value);
  const currentPrivateKey = crypto.createPrivateKey(
    getCurrentOidcPrivateKey(configs[LogtoOidcConfigKey.PrivateKeys]).value
  );
  const privateKeys = getOidcProviderPrivateKeys(configs[LogtoOidcConfigKey.PrivateKeys]).map(
    ({ value }) => crypto.createPrivateKey(value)
  );
  const session = configs[LogtoOidcConfigKey.Session];
  const privateJwks = await Promise.all(privateKeys.map(async (key) => exportJWK(key)));
  const publicJwks = await getOidcProviderPublicJwks(configs[LogtoOidcConfigKey.PrivateKeys]);
  const localJWKSet = createLocalJWKSet({ keys: publicJwks });
  const currentPrivateJwk = await exportJWK(currentPrivateKey);

  // Pick the JWA that matches the current signing key's type. Leaving it `undefined` lets
  // `oidc-provider` fall back to its `RS256` default, which is only correct for RSA keys — hence the
  // explicit mapping for EC (`ES384`) and Ed25519/OKP (`EdDSA`). Getting this wrong signs tokens with
  // an algorithm that doesn't match the key, so verification fails.
  // RSA intentionally stays `undefined` for backwards compatibility — we used RSA before v1.0.0-beta.20.
  const jwkSigningAlg =
    conditional(currentPrivateJwk.kty === 'EC' && 'ES384') ??
    conditional(currentPrivateJwk.kty === 'OKP' && 'EdDSA');

  return Object.freeze({
    cookieKeys,
    privateJwks,
    publicJwks,
    jwkSigningAlg,
    localJWKSet,
    sessionTtl: session.ttl,
    issuer,
  });
};

export default loadOidcValues;
