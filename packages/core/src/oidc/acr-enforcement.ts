/**
 * Step-up ACR enforcement at token-issuance time (Phase 3).
 *
 * At grant time (refresh-token, token-exchange, authorization-code), once the set of scopes
 * being granted into an access token is known we look up their `required_acr` from the DB,
 * resolve the effective required ACR (scope > resource > app > org max), and compare it to
 * the session's current ACR.
 *
 * Two enforcement modes:
 *   - HARD (default): throw `InsufficientScope` so oidc-provider returns a 401 with
 *     `insufficient_scope` and a `www-authenticate` challenge. The client SDK then calls
 *     `/oidc/auth?acr_values=…` to trigger the step-up flow.
 *   - STRIP (optional): silently remove the under-guarded scopes from the token. Use this
 *     when the client should still receive a valid token for non-sensitive scopes even without
 *     elevation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9470 | RFC 9470 OAuth 2.0 Step Up Authentication Challenge Protocol}
 */

import { AcrShortfallReason, evaluateAcr, resolveRequiredAcr } from '@logto/schemas';
import { errors } from 'oidc-provider';

import type Queries from '#src/tenants/Queries.js';

const { InsufficientScope } = errors;

type AcrEnforcementMode = 'hard' | 'strip';

type AcrEnforcementContext = {
  /** Scope names currently being granted into the access token. */
  grantedScopeNames: string[];
  /** The resource indicator (URL) the token is being issued for. */
  resourceIndicator: string;
  /** The session's current ACR value, taken from the refresh / id token. */
  sessionAcr?: string;
  /** When the current ACR was established (seconds since epoch, like OIDC `auth_time`). */
  sessionAcrEstablishedAt?: number;
  /** Per-app `defaultAcrValues` baseline from the client metadata. */
  applicationDefaultAcrs?: Array<string | undefined>;
  /**
   * Freshness TTL for the required ACR in seconds. When the session's last elevation
   * is older than this, the session is treated as un-elevated even if the ACR rank is
   * sufficient. `undefined` disables the freshness check.
   */
  freshnessTtlSeconds?: number;
  /** Current time in seconds since epoch. Pass `Date.now() / 1000` from the caller. */
  nowSeconds: number;
};

/**
 * Enforce the step-up ACR requirement for a token-issuance grant.
 *
 * - Mode `'hard'` (default): throws `InsufficientScope` when the session ACR is below the
 *   required level or has expired. The error carries the required ACR as the `scope` hint so
 *   the client knows what to request in the subsequent `acr_values` auth request.
 *
 * - Mode `'strip'`: returns the subset of scope names whose individual `required_acr`
 *   the session satisfies, stripping any that need a higher ACR. If every scope passes,
 *   returns the original array unchanged.
 *
 * @returns The (possibly narrowed) scope-name set when mode is `'strip'`, or the original
 *   names when mode is `'hard'` and the check passes.
 */
export const enforceAcrForGrant = async (
  queries: Queries,
  ctx: AcrEnforcementContext,
  mode: AcrEnforcementMode = 'hard'
): Promise<string[]> => {
  const {
    grantedScopeNames,
    resourceIndicator,
    sessionAcr,
    sessionAcrEstablishedAt,
    applicationDefaultAcrs,
    freshnessTtlSeconds,
    nowSeconds,
  } = ctx;

  if (grantedScopeNames.length === 0) {
    return grantedScopeNames;
  }

  const [scopeRows, resourceRow] = await Promise.all([
    queries.scopes.findScopesByNamesAndResourceIndicator(grantedScopeNames, resourceIndicator),
    queries.resources.findResourceByIndicator(resourceIndicator),
  ]);

  if (mode === 'strip') {
    // Per-scope check: only strip scopes the session can't satisfy individually.
    const sessionState = { acr: sessionAcr, acrEstablishedAt: sessionAcrEstablishedAt };

    const passing = grantedScopeNames.filter((name) => {
      const scopeRow = scopeRows.find((row) => row.name === name);
      const effectiveRequired = resolveRequiredAcr({
        scopeAcrs: [scopeRow?.requiredAcr],
        resourceDefaultAcr: resourceRow?.defaultAcr,
        applicationDefaultAcrs,
      });

      if (!effectiveRequired) {
        return true;
      }

      return (
        evaluateAcr(sessionState, effectiveRequired, nowSeconds, freshnessTtlSeconds) === undefined
      );
    });

    return passing;
  }

  // Hard mode: compute the single highest requirement across all granted scopes.
  const requiredAcr = resolveRequiredAcr({
    scopeAcrs: scopeRows.map((row) => row.requiredAcr),
    resourceDefaultAcr: resourceRow?.defaultAcr,
    applicationDefaultAcrs,
  });

  if (!requiredAcr) {
    return grantedScopeNames;
  }

  const shortfall = evaluateAcr(
    { acr: sessionAcr, acrEstablishedAt: sessionAcrEstablishedAt },
    requiredAcr,
    nowSeconds,
    freshnessTtlSeconds
  );

  if (shortfall === AcrShortfallReason.Stale) {
    throw new InsufficientScope(
      `step-up required: session ACR "${sessionAcr ?? 'none'}" has exceeded the freshness window for "${requiredAcr}"`,
      requiredAcr
    );
  }

  if (shortfall === AcrShortfallReason.Insufficient) {
    throw new InsufficientScope(
      `step-up required: session ACR "${sessionAcr ?? 'none'}" does not satisfy required "${requiredAcr}"`,
      requiredAcr
    );
  }

  return grantedScopeNames;
};
