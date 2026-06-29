import { createMockUtils } from '@logto/shared/esm';
import { Provider } from 'oidc-provider';
import Sinon from 'sinon';

import { EnvSet, UserApps } from '#src/env-set/index.js';
import { MockQueries } from '#src/test-utils/tenant.js';
import { createContextWithRouteParameters } from '#src/utils/test-utils.js';

const { jest } = import.meta;

const { mockEsmWithActual } = createMockUtils(jest);

await mockEsmWithActual('fs/promises', () => ({
  readdir: jest.fn().mockResolvedValue(['index.js']),
}));

const {
  default: koaSpaSessionGuard,
  sessionNotFoundPath,
  guardedPath,
} = await import('./koa-spa-session-guard.js');

describe('koaSpaSessionGuard', () => {
  const envBackup = process.env;
  const provider = new Provider('https://logto.test');
  const interactionDetails = jest.spyOn(provider, 'interactionDetails');
  const getRowsByKeys = jest.fn().mockResolvedValue({ rows: [] });
  const findDefaultSignInExperience = jest.fn().mockResolvedValue({});
  const queries = new MockQueries({
    logtoConfigs: { getRowsByKeys },
    signInExperiences: { findDefaultSignInExperience },
  });

  beforeEach(() => {
    process.env = { ...envBackup };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  const next = jest.fn();

  for (const app of Object.values(UserApps)) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    it(`${app} path should not redirect`, async () => {
      const ctx = createContextWithRouteParameters({
        url: `/${app}/foo`,
      });

      await koaSpaSessionGuard(provider, queries)(ctx, next);

      expect(ctx.redirect).not.toBeCalled();
    });
  }

  it(`should not redirect for path ${sessionNotFoundPath}`, async () => {
    interactionDetails.mockRejectedValue(new Error('session not found'));
    const ctx = createContextWithRouteParameters({
      url: `${sessionNotFoundPath}`,
    });
    await koaSpaSessionGuard(provider, queries)(ctx, next);
    expect(ctx.redirect).not.toBeCalled();
  });

  it(`should not redirect for path /callback`, async () => {
    interactionDetails.mockRejectedValue(new Error('session not found'));
    const ctx = createContextWithRouteParameters({
      url: '/callback/github',
    });
    await koaSpaSessionGuard(provider, queries)(ctx, next);
    expect(ctx.redirect).not.toBeCalled();
  });

  it('should not redirect if session found', async () => {
    // @ts-expect-error
    interactionDetails.mockResolvedValue({});
    const ctx = createContextWithRouteParameters({
      url: `/sign-in`,
    });
    await koaSpaSessionGuard(provider, queries)(ctx, next);
    expect(ctx.redirect).not.toBeCalled();
  });

  for (const path of ['/', ...guardedPath]) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    it(`should redirect if session not found for ${path}`, async () => {
      interactionDetails.mockRejectedValue(new Error('session not found'));
      const ctx = createContextWithRouteParameters({
        url: `${path}/foo`,
      });
      await koaSpaSessionGuard(provider, queries)(ctx, next);
      expect(ctx.redirect).toBeCalledWith('https://logto.test/unknown-session');
    });
  }

  it('should redirect to configured unknown session redirect URL in SIE if session not found for a selected path', async () => {
    const unknownSessionRedirectUrl = 'https://foo.bar/redirect';

    interactionDetails.mockRejectedValue(new Error('session not found'));
    findDefaultSignInExperience.mockResolvedValueOnce({
      unknownSessionRedirectUrl,
    });

    const ctx = createContextWithRouteParameters({
      url: `${guardedPath[0]!}/foo`,
    });
    await koaSpaSessionGuard(provider, queries)(ctx, next);
    expect(ctx.redirect).toBeCalledWith(unknownSessionRedirectUrl);
  });

  it('should redirect to configured URL if session not found for a selected path', async () => {
    interactionDetails.mockRejectedValue(new Error('session not found'));
    getRowsByKeys.mockResolvedValueOnce({ rows: [{ value: { url: 'https://foo.bar' } }] });

    const ctx = createContextWithRouteParameters({
      url: `${guardedPath[0]!}/foo`,
    });
    await koaSpaSessionGuard(provider, queries)(ctx, next);
    expect(ctx.redirect).toBeCalledWith('https://foo.bar');
  });

  it(`should redirect to current hostname if isDomainBasedMultiTenancy`, async () => {
    const stub = Sinon.stub(EnvSet, 'values').value({
      ...EnvSet.values,
      isDomainBasedMultiTenancy: true,
    });
    interactionDetails.mockRejectedValue(new Error('session not found'));
    const ctx = createContextWithRouteParameters({
      url: '/sign-in/foo',
    });
    await koaSpaSessionGuard(provider, queries)(ctx, next);
    expect(ctx.redirect).toBeCalledWith('https://test.com/unknown-session');
    stub.restore();
  });

  describe('app login recovery (originating-app redirect)', () => {
    const findApplicationById = jest.fn();
    const recoveryQueries = new MockQueries({
      logtoConfigs: { getRowsByKeys },
      signInExperiences: { findDefaultSignInExperience },
      applications: { findApplicationById },
    });

    it('redirects to the originating app login entry (resolved from the _logto cookie) on a protocol match', async () => {
      interactionDetails.mockRejectedValue(new Error('session not found'));
      findApplicationById.mockResolvedValueOnce({
        oidcClientMetadata: {
          postLogoutRedirectUris: ['http://localhost:3002/login', 'https://app.example.com/login'],
        },
      });

      const ctx = createContextWithRouteParameters({
        url: '/sign-in/foo',
        cookies: { _logto: '{ "appId": "test-app-id" }' },
      });
      await koaSpaSessionGuard(provider, recoveryQueries)(ctx, next);

      // The mock request protocol is `http`, so the http entry is selected.
      expect(findApplicationById).toBeCalledWith('test-app-id');
      expect(ctx.redirect).toBeCalledWith('http://localhost:3002/login');
    });

    it('falls back to the first post-logout URI when no protocol matches', async () => {
      interactionDetails.mockRejectedValue(new Error('session not found'));
      findApplicationById.mockResolvedValueOnce({
        oidcClientMetadata: { postLogoutRedirectUris: ['https://app.example.com/login'] },
      });

      const ctx = createContextWithRouteParameters({
        url: '/sign-in/foo',
        cookies: { _logto: '{ "appId": "test-app-id" }' },
      });
      await koaSpaSessionGuard(provider, recoveryQueries)(ctx, next);

      expect(ctx.redirect).toBeCalledWith('https://app.example.com/login');
    });

    it('falls through to /unknown-session when the cookie has no appId', async () => {
      interactionDetails.mockRejectedValue(new Error('session not found'));

      const ctx = createContextWithRouteParameters({
        url: '/sign-in/foo',
        cookies: { _logto: '{ "uiLocales": "en" }' },
      });
      await koaSpaSessionGuard(provider, recoveryQueries)(ctx, next);

      expect(findApplicationById).not.toBeCalled();
      expect(ctx.redirect).toBeCalledWith('https://logto.test/unknown-session');
    });

    it('falls through to /unknown-session when the app cannot be resolved', async () => {
      interactionDetails.mockRejectedValue(new Error('session not found'));
      findApplicationById.mockRejectedValueOnce(new Error('entity.not_exists_with_id'));

      const ctx = createContextWithRouteParameters({
        url: '/sign-in/foo',
        cookies: { _logto: '{ "appId": "stale-app-id" }' },
      });
      await koaSpaSessionGuard(provider, recoveryQueries)(ctx, next);

      expect(ctx.redirect).toBeCalledWith('https://logto.test/unknown-session');
    });

    it('falls through to a configured unknownSessionRedirectUrl when there is no app cookie', async () => {
      interactionDetails.mockRejectedValue(new Error('session not found'));
      findDefaultSignInExperience.mockResolvedValueOnce({
        unknownSessionRedirectUrl: 'https://configured.example/redirect',
      });

      const ctx = createContextWithRouteParameters({ url: '/sign-in/foo' });
      await koaSpaSessionGuard(provider, recoveryQueries)(ctx, next);

      expect(ctx.redirect).toBeCalledWith('https://configured.example/redirect');
    });
  });
});
