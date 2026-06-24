/**
 * @overview Fork of the oidc-provider `authorization_code` grant, extended with:
 *   - Application-level access-control check (mirrors refresh-token / token-exchange grants).
 *   - Scope-level step-up ACR enforcement (RFC 9470): if any granted scope carries a
 *     `required_acr` that exceeds the session's current ACR (`code.acr`), the grant throws
 *     `InsufficientScope` so the client re-authorises with the correct `acr_values`.
 *
 * Apart from those two additions all code is kept verbatim from the upstream file so that it
 * stays easy to diff against future oidc-provider upgrades.
 *
 * @see {@link https://github.com/panva/node-oidc-provider/blob/v8.6.1/lib/actions/grants/authorization_code.js | Upstream file (v8.6.1)}
 *
 * @remarks
 * Since the original code is not exported, we have to copy it here. Treat this file as a fork:
 * keep it in sync with the upstream when oidc-provider is upgraded.
 */

import type { Provider } from 'oidc-provider';
import { errors } from 'oidc-provider';
import filterClaims from 'oidc-provider/lib/helpers/filter_claims.js';
import checkPKCE from 'oidc-provider/lib/helpers/pkce.js';
import resolveResource from 'oidc-provider/lib/helpers/resolve_resource.js';
import revoke from 'oidc-provider/lib/helpers/revoke.js';
import dpopValidate from 'oidc-provider/lib/helpers/validate_dpop.js';
import presence from 'oidc-provider/lib/helpers/validate_presence.js';
import instance from 'oidc-provider/lib/helpers/weak_cache.js';
import checkRar from 'oidc-provider/lib/shared/check_rar.js';

import { type EnvSet } from '#src/env-set/index.js';
import { enforceAcrForGrant } from '#src/oidc/acr-enforcement.js';
import { assertUserHasApplicationAccessForOidc } from '#src/oidc/application-access-control.js';
import type Libraries from '#src/tenants/Libraries.js';
import type Queries from '#src/tenants/Queries.js';

const { InvalidGrant } = errors;

const gty = 'authorization_code';

/**
 * Valid parameters for the `authorization_code` grant type.
 * `resource` is appended dynamically by `registerGrants` when resource indicators are enabled.
 */
export const parameters = Object.freeze(['code', 'code_verifier', 'redirect_uri']);

type Handler = (
  envSet: EnvSet,
  queries: Queries,
  applicationAccessControl: Libraries['applicationAccessControl']
) => Parameters<Provider['registerGrantType']>[1];

// Disable FP rules: the original implementation uses mutable variables throughout.
/* eslint-disable complexity, @silverhand/fp/no-let, @typescript-eslint/no-non-null-assertion, @silverhand/fp/no-mutation, unicorn/no-array-method-this-argument */

export const buildHandler: Handler = (envSet, queries, appAccess) => async (ctx, next) => {
  const { client, params } = ctx.oidc;

  const providerConfig = instance(ctx.oidc.provider).configuration();
  const {
    issueRefreshToken,
    allowOmittingSingleRegisteredRedirectUri,
    conformIdTokenClaims,
    features: {
      userinfo,
      mTLS: { getCertificate },
      resourceIndicators,
    },
  } = providerConfig;
  // RichAuthorizationRequests and dPoP.allowReplay exist at runtime but are absent from the
  // public typings. Cast the features object through `unknown` to access them without `as any`.
  type RuntimeFeatures = {
    richAuthorizationRequests?: {
      enabled: boolean;
      rarForCodeResponse: (...args: unknown[]) => Promise<unknown>;
    };
    dPoP?: { allowReplay: boolean };
  };

  // Double-cast needed: `features` has runtime properties absent from the public typings.
  /* eslint-disable no-restricted-syntax */
  const { richAuthorizationRequests, dPoP: dPopFeature } =
    providerConfig.features as unknown as RuntimeFeatures;
  /* eslint-enable no-restricted-syntax */
  const allowReplay = dPopFeature?.allowReplay;

  if (allowOmittingSingleRegisteredRedirectUri && params?.redirect_uri === undefined) {
    // @ts-expect-error -- redirectUris is available on client at runtime
    const { 0: uri, length } = ctx.oidc.client!.redirectUris;
    if (uri && length === 1) {
      params!.redirect_uri = uri;
    }
  }

  presence(ctx, 'code', 'redirect_uri');

  const dPoP = await dpopValidate(ctx);

  const code = await ctx.oidc.provider.AuthorizationCode.find(String(params?.code), {
    ignoreExpiration: true,
  });

  if (!code) {
    throw new InvalidGrant('authorization code not found');
  }

  if (code.clientId !== client!.clientId) {
    throw new InvalidGrant('client mismatch');
  }

  if (code.isExpired) {
    throw new InvalidGrant('authorization code is expired');
  }

  const grant = await ctx.oidc.provider.Grant.find(code.grantId!, {
    ignoreExpiration: true,
  });

  if (!grant) {
    throw new InvalidGrant('grant not found');
  }

  // @ts-expect-error -- isExpired is available on Grant at runtime but absent from typings
  if (grant.isExpired) {
    throw new InvalidGrant('grant is expired');
  }

  // CodeChallenge and codeChallengeMethod are available on AuthorizationCode at runtime but
  // absent from the public typings — access via @ts-expect-error.

  checkPKCE(
    // Params values are `unknown`; code_verifier is always a string or absent in practice.
    // eslint-disable-next-line no-restricted-syntax
    params?.code_verifier as string | undefined,
    code.codeChallenge,
    code.codeChallengeMethod
  );

  let cert;
  if (client!.tlsClientCertificateBoundAccessTokens) {
    cert = getCertificate(ctx);
    if (!cert) {
      throw new InvalidGrant('mutual TLS client certificate not provided');
    }
  }

  if (!dPoP && client!.dpopBoundAccessTokens) {
    throw new InvalidGrant('DPoP proof JWT not provided');
  }

  if (grant.clientId !== client!.clientId) {
    throw new InvalidGrant('client mismatch');
  }

  if (code.redirectUri !== params?.redirect_uri) {
    throw new InvalidGrant('authorization code redirect_uri mismatch');
  }

  if (code.consumed) {
    await revoke(ctx, code.grantId!);
    throw new InvalidGrant('authorization code already consumed');
  }

  await code.consume();

  ctx.oidc.entity('AuthorizationCode', code);
  ctx.oidc.entity('Grant', grant);

  const account = await ctx.oidc.provider.Account.findAccount(ctx, code.accountId!, code);

  if (!account) {
    throw new InvalidGrant('authorization code invalid (referenced account not found)');
  }

  if (code.accountId !== grant.accountId) {
    throw new InvalidGrant('accountId mismatch');
  }

  ctx.oidc.entity('Account', account);

  // Application-level access control (first-party apps only — mirrors refresh-token grant).
  await assertUserHasApplicationAccessForOidc(
    appAccess,
    client!.clientId,
    account.accountId,
    client!.metadata().appLevelAccessControlEnabled
  );

  const { AccessToken, IdToken, RefreshToken } = ctx.oidc.provider;

  const at = new AccessToken({
    accountId: account.accountId,
    client: client!,
    expiresWithSession: code.expiresWithSession ?? false,
    grantId: code.grantId!,
    gty,
    sessionUid: code.sessionUid!,
    sid: code.sid!,
    scope: undefined!,
  });

  if (client!.tlsClientCertificateBoundAccessTokens) {
    // @ts-expect-error -- setThumbprint is a runtime method present on AccessToken
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    at.setThumbprint('x5t', cert);
  }

  if (code.dpopJkt && !dPoP) {
    throw new InvalidGrant('missing DPoP proof JWT');
  }

  if (dPoP) {
    if (code.dpopJkt && code.dpopJkt !== dPoP.thumbprint) {
      throw new InvalidGrant('DPoP proof key thumbprint does not match dpop_jkt');
    }

    // @ts-expect-error -- setThumbprint is a runtime method present on AccessToken
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    at.setThumbprint('jkt', dPoP.thumbprint);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await checkRar(ctx, async () => {});

  const resource = await resolveResource(ctx, code, { userinfo, resourceIndicators });

  if (resource) {
    const resourceServerInfo = await resourceIndicators.getResourceServerInfo(
      ctx,
      resource,
      client!
    );
    // @ts-expect-error -- code from oidc-provider
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    at.resourceServer = new ctx.oidc.provider.ResourceServer(resource, resourceServerInfo);
    at.scope = grant.getResourceScopeFiltered(resource, code.scopes);

    /* === Step-up ACR enforcement (RFC 9470) === */
    // `code.acr` is the ACR the user authenticated at during the authorisation request.
    // If any granted scope declares a `required_acr` higher than the session's current level,
    // throw `InsufficientScope` so the client re-initiates `/oidc/auth?acr_values=…` before
    // retrying the code exchange.
    const grantedScopeNames = (at.scope ?? '').split(' ').filter(Boolean);
    await enforceAcrForGrant(queries, {
      grantedScopeNames,
      resourceIndicator: resource,
      sessionAcr: code.acr,
      applicationDefaultAcrs: client!.metadata().defaultAcrValues,
      nowSeconds: Math.floor(Date.now() / 1000),
    });
    /* === End Step-up ACR enforcement === */
  } else {
    at.claims = code.claims;
    at.scope = grant.getOIDCScopeFiltered(code.scopes);
  }

  if (richAuthorizationRequests?.enabled && at.resourceServer) {
    // @ts-expect-error -- rar is a runtime field on AccessToken absent from typings

    at.rar = await richAuthorizationRequests.rarForCodeResponse(ctx, at.resourceServer);
  }

  ctx.oidc.entity('AccessToken', at);
  const accessToken = await at.save();

  let refreshToken;
  if (await issueRefreshToken(ctx, client!, code)) {
    const rt = new RefreshToken({
      accountId: account.accountId,
      acr: code.acr,
      amr: code.amr,
      authTime: code.authTime,
      claims: code.claims,
      client: client!,
      expiresWithSession: code.expiresWithSession,
      grantId: code.grantId!,
      gty,
      nonce: code.nonce!,
      resource: code.resource,
      rotations: 0,
      scope: code.scope!,
      sessionUid: code.sessionUid!,
      sid: code.sid!,
      rar: code.rar,
    });

    if (client!.clientAuthMethod === 'none') {
      if (at.jkt) {
        rt.jkt = at.jkt;
      }

      if (at['x5t#S256']) {
        rt['x5t#S256'] = at['x5t#S256'];
      }
    }

    ctx.oidc.entity('RefreshToken', rt);
    refreshToken = await rt.save();
  }

  let idToken;
  if (code.scopes.has('openid')) {
    const claims = filterClaims(code.claims, 'id_token', grant);
    // @ts-expect-error -- code from oidc-provider
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const rejected: string[] = grant.getRejectedOIDCClaims();
    const token = new IdToken(
      {
        ...(await account.claims('id_token', code.scope!, claims, rejected)),
        acr: code.acr,
        amr: code.amr,
        auth_time: code.authTime,
      },
      { ctx }
    );

    // eslint-disable-next-line unicorn/prefer-ternary
    if (conformIdTokenClaims && userinfo.enabled && !at.aud) {
      // @ts-expect-error -- code from oidc-provider
      token.scope = 'openid';
    } else {
      // @ts-expect-error -- code from oidc-provider
      token.scope = grant.getOIDCScopeFiltered(code.scopes);
    }

    // @ts-expect-error -- code from oidc-provider
    token.mask = claims;
    // @ts-expect-error -- code from oidc-provider
    token.rejected = rejected;

    token.set('nonce', code.nonce);
    token.set('at_hash', accessToken);
    token.set('sid', code.sid);

    idToken = await token.issue({ use: 'idtoken' });
  }

  ctx.body = {
    access_token: accessToken,
    expires_in: at.expiration,
    id_token: idToken,
    refresh_token: refreshToken,
    // Keep at.scope rather than code.scope — the upstream changed this in a non-semver bump;
    // we revert to maintain compatibility with the previous behaviour.
    scope: at.scope,
    token_type: at.tokenType,
    // @ts-expect-error -- code from oidc-provider
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    authorization_details: at.rar,
  };

  await next();
};

/* eslint-enable complexity, @silverhand/fp/no-let, @typescript-eslint/no-non-null-assertion, @silverhand/fp/no-mutation, unicorn/no-array-method-this-argument */

export { GrantType } from '@logto/schemas';
