import {
  logtoConfigGuards,
  logtoCookieKey,
  logtoUiCookieGuard,
  LogtoTenantConfigKey,
} from '@logto/schemas';
import { appendPath, trySafe } from '@silverhand/essentials';
import type { Context, MiddlewareType } from 'koa';
import type { IRouterParamContext } from 'koa-router';
import type { Provider } from 'oidc-provider';

import { EnvSet, getTenantEndpoint } from '#src/env-set/index.js';
import RequestError from '#src/errors/RequestError/index.js';
import type Queries from '#src/tenants/Queries.js';
import { getTenantId } from '#src/utils/tenant.js';

// Need To Align With UI
export const sessionNotFoundPath = '/unknown-session';

/**
 * Recover a dead/expired OIDC interaction by sending the user back to the originating
 * application's own login entry, so a fresh interaction is minted.
 *
 * Why this is the only recovery that works: an interaction can ONLY be (re)minted by
 * oidc-provider's `/oidc/auth`, which is triggered exclusively from an app's login flow
 * (the SDK's `signIn()`), NOT by re-entering the experience UI at `/sign-in`. The guard
 * below only *checks* for an interaction; it never mints one. So the experience app's
 * "Back to sign in" → `/sign-in` redirect just re-enters this guard, which throws again,
 * and the user dead-loops between `/sign-in` and `/unknown-session`.
 *
 * The originating app is identifiable from the `_logto` shared-experience cookie (set on
 * the last successful `/oidc/auth` with the requesting `appId`); the cookie outlives the
 * interaction. From the app's registered post-logout redirect URIs we pick the one whose
 * origin protocol matches the current request: that URI is the app's own public entry,
 * and loading it re-initiates the sign-in flow (`/oidc/auth`) → fresh interaction. A
 * single tenant-wide `unknownSessionRedirectUrl` cannot route per-app when one tenant
 * serves multiple applications.
 *
 * Returns the redirect target, or `undefined` if the app can't be resolved (no/empty
 * cookie, unknown app, no usable post-logout URI) — callers must fall through to the
 * existing `unknownSessionRedirectUrl` / `SessionNotFoundRedirectUrl` / `/unknown-session`
 * behavior so this is purely additive with zero regression.
 */
const tryGetAppLoginRedirect = async (
  ctx: Context,
  queries: Queries
): Promise<string | undefined> => {
  const { appId } =
    trySafe(() => logtoUiCookieGuard.parse(JSON.parse(ctx.cookies.get(logtoCookieKey) ?? '{}'))) ??
    {};

  if (!appId) {
    return;
  }

  const application = await trySafe(async () => queries.applications.findApplicationById(appId));

  if (!application) {
    return;
  }

  const { postLogoutRedirectUris } = application.oidcClientMetadata;

  // Prefer a post-logout URI on the SAME protocol as the current request so a prod (https)
  // request never recovers to a localhost (http) entry and vice versa. Each app registers a
  // single public entry per environment, so a protocol match uniquely selects the right one.
  const sameProtocol = `${ctx.request.protocol}:`;
  return (
    postLogoutRedirectUris.find((uri) => trySafe(() => new URL(uri).protocol) === sameProtocol) ??
    postLogoutRedirectUris[0]
  );
};

export const guardedPath = [
  '/sign-in',
  '/consent',
  '/register',
  '/single-sign-on',
  '/social/register',
  '/forgot-password',
];

export default function koaSpaSessionGuard<
  StateT,
  ContextT extends IRouterParamContext,
  ResponseBodyT,
>(provider: Provider, queries: Queries): MiddlewareType<StateT, ContextT, ResponseBodyT> {
  return async (ctx, next) => {
    const requestPath = ctx.request.path;
    const isPreview = ctx.request.URL.searchParams.get('preview');

    const isSessionRequiredPath =
      requestPath === '/' || guardedPath.some((path) => requestPath.startsWith(path));

    if (isSessionRequiredPath && !isPreview) {
      try {
        await provider.interactionDetails(ctx.req, ctx.res);
      } catch {
        // Preferred recovery: bounce the user back to the ORIGINATING app's login entry
        // (resolved from the `_logto` cookie's appId), which re-mints a fresh interaction via
        // `/oidc/auth`. This breaks the `/sign-in` ⇄ `/unknown-session` dead-loop at its root —
        // and unlike the single tenant-wide `unknownSessionRedirectUrl` below, it routes each
        // app home correctly when one tenant serves multiple apps.
        const appLoginRedirect = await tryGetAppLoginRedirect(ctx, queries);

        if (appLoginRedirect) {
          ctx.redirect(appLoginRedirect);

          return;
        }

        // For unknown session, check if there is a redirect URL set in the SignInExperience
        const { unknownSessionRedirectUrl } =
          await queries.signInExperiences.findDefaultSignInExperience();

        if (unknownSessionRedirectUrl) {
          ctx.redirect(unknownSessionRedirectUrl);

          return;
        }

        // If not, check if there is a redirect URL set in the tenant level LogtoConfigs
        const {
          rows: [data],
        } = await queries.logtoConfigs.getRowsByKeys([
          LogtoTenantConfigKey.SessionNotFoundRedirectUrl,
        ]);
        const parsed = trySafe(() =>
          logtoConfigGuards.sessionNotFoundRedirectUrl.parse(data?.value)
        );

        if (parsed?.url) {
          ctx.redirect(parsed.url);

          return;
        }

        // Redirect to the tenant's own session not found page
        const [tenantId] = await getTenantId(ctx.URL);

        if (!tenantId) {
          throw new RequestError({ code: 'session.not_found', status: 404 });
        }

        const tenantEndpoint = getTenantEndpoint(tenantId, EnvSet.values);

        if (EnvSet.values.isDomainBasedMultiTenancy) {
          // Replace to current hostname (if custom domain is used)
          // eslint-disable-next-line @silverhand/fp/no-mutation
          tenantEndpoint.hostname = ctx.request.hostname;
        }

        ctx.redirect(appendPath(tenantEndpoint, sessionNotFoundPath).href);

        return;
      }
    }

    return next();
  };
}
