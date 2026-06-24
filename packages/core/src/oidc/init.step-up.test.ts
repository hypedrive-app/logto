/**
 * Step-up authentication (RFC 9470) detection in the OIDC `interactions.url` builder.
 *
 * The provider injects a `step_up_acr` extra param into the experience URL when an authorization
 * request carries `acr_values` (or a per-application `defaultAcrValues`) AND the request already
 * has an authenticated session. These tests pin that trust boundary:
 *
 *  - step-up is detected only for the `login` prompt with an existing session;
 *  - only ACR values the AS actually supports are propagated;
 *  - per-application `defaultAcrValues` is honoured when the client omits `acr_values`;
 *  - without a session (or for an unknown ACR) the request falls through to the normal flow.
 */

import { ExtraParamsKey, LogtoAcrValues } from '@logto/schemas';
import instance from 'oidc-provider/lib/helpers/weak_cache.js';

import { mockEnvSet } from '#src/test-utils/env-set.js';
import { createOidcContext } from '#src/test-utils/oidc-provider.js';
import { MockTenant } from '#src/test-utils/tenant.js';

import initOidc from './init.js';

const { jest } = import.meta;

const createProvider = (tenant: MockTenant) =>
  initOidc(
    tenant.id,
    mockEnvSet,
    tenant.queries,
    tenant.libraries,
    tenant.logtoConfigs,
    tenant.subscription
  );

/**
 * Invoke the provider's `interactions.url` builder for a `login` prompt and return the resulting
 * experience URL, with control over the OIDC `params`, the existing session, and the client's
 * configured metadata.
 */
const buildLoginInteractionUrl = async ({
  params = {},
  accountId,
  defaultAcrValues,
}: {
  params?: Record<string, unknown>;
  accountId?: string;
  defaultAcrValues?: string[];
}) => {
  const tenant = new MockTenant();
  const provider = createProvider(tenant);
  const configuration = instance(provider).configuration();

  const session = accountId ? { accountId } : undefined;
  const client = { metadata: () => ({ defaultAcrValues }) };
  const ctx = createOidcContext({
    params,
    session: session as never,
    client: client as never,
  });

  // `interactions.url` writes server-side-rendering cookies via the top-level Koa `ctx.cookies`.
  // eslint-disable-next-line @silverhand/fp/no-mutation
  (ctx as { cookies: unknown }).cookies = { get: jest.fn(), set: jest.fn() };

  return configuration.interactions.url(ctx, {
    prompt: { name: 'login', reasons: [], details: {} },
    params: { client_id: 'mock_client' },
  } as never);
};

describe('oidc interactions.url step-up detection', () => {
  it('injects step_up_acr when acr_values is present and a session exists', async () => {
    const url = await buildLoginInteractionUrl({
      params: { acr_values: LogtoAcrValues.Mfa },
      accountId: 'account_id',
    });

    expect(url).toContain(`${ExtraParamsKey.StepUpAcr}=${encodeURIComponent(LogtoAcrValues.Mfa)}`);
  });

  it('injects step_up_acr for the phishing-resistant ACR when a session exists', async () => {
    const url = await buildLoginInteractionUrl({
      params: { acr_values: LogtoAcrValues.PhishingResistant },
      accountId: 'account_id',
    });

    expect(url).toContain(
      `${ExtraParamsKey.StepUpAcr}=${encodeURIComponent(LogtoAcrValues.PhishingResistant)}`
    );
  });

  it('does NOT inject step_up_acr without an existing session', async () => {
    const url = await buildLoginInteractionUrl({
      params: { acr_values: LogtoAcrValues.Mfa },
      // No accountId — fresh login.
    });

    expect(url).not.toContain(ExtraParamsKey.StepUpAcr);
  });

  it('falls back to the client default_acr_values when acr_values is omitted', async () => {
    const url = await buildLoginInteractionUrl({
      params: {},
      accountId: 'account_id',
      defaultAcrValues: [LogtoAcrValues.Mfa],
    });

    expect(url).toContain(`${ExtraParamsKey.StepUpAcr}=${encodeURIComponent(LogtoAcrValues.Mfa)}`);
  });

  it('ignores an unsupported acr value', async () => {
    const url = await buildLoginInteractionUrl({
      params: { acr_values: 'urn:example:unsupported' },
      accountId: 'account_id',
    });

    expect(url).not.toContain(ExtraParamsKey.StepUpAcr);
  });

  it('prefers an explicit acr_values over the client default', async () => {
    const url = await buildLoginInteractionUrl({
      params: { acr_values: LogtoAcrValues.Password },
      accountId: 'account_id',
      defaultAcrValues: [LogtoAcrValues.Mfa],
    });

    expect(url).toContain(
      `${ExtraParamsKey.StepUpAcr}=${encodeURIComponent(LogtoAcrValues.Password)}`
    );
  });
});
