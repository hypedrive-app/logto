import { acrMax, acrSatisfies, type LogtoAcrValue } from '../consts/oidc.js';

/**
 * The set of step-up requirement inputs that combine into a single effective requirement for a
 * token request. Each is optional; an absent input contributes nothing.
 *
 * Precedence is **not** "first wins" — it is the *strongest* (`max`) of all inputs, because a
 * requirement declared at any level is a floor, never a ceiling. See {@link resolveRequiredAcr}.
 */
export type RequiredAcrInputs = {
  /**
   * The `required_acr` of every scope being granted into the token. The strongest one drives the
   * requirement, so a single sensitive scope (e.g. `wallet:withdraw`) elevates the whole request.
   */
  scopeAcrs?: Array<string | undefined | null>;
  /** The `default_acr` of the resource the token is being issued for. */
  resourceDefaultAcr?: string | null;
  /** The application's `defaultAcrValues` baseline (lowest-priority, may be multiple). */
  applicationDefaultAcrs?: Array<string | undefined | null>;
  /** The org-level step-up floor (e.g. "all money actions phishing-resistant for this org"). */
  organizationMinAcr?: string | null;
};

/**
 * Resolve the single effective required ACR for a token request by taking the *strongest* of all
 * declared requirements (scope > resource > app > org are all floors; the max wins).
 *
 * Returns `undefined` when nothing requires step-up — the caller issues the token normally.
 *
 * Pure and I/O-free on purpose: the OIDC enforcement layer, the Console preview, and the unit
 * tests all share exactly this definition of "what does this request require?".
 */
export const resolveRequiredAcr = (inputs: RequiredAcrInputs): LogtoAcrValue | undefined => {
  const { scopeAcrs, resourceDefaultAcr, applicationDefaultAcrs, organizationMinAcr } = inputs;

  return acrMax(
    ...(scopeAcrs ?? []).map((value) => value ?? undefined),
    resourceDefaultAcr ?? undefined,
    ...(applicationDefaultAcrs ?? []).map((value) => value ?? undefined),
    organizationMinAcr ?? undefined
  );
};

/**
 * The current session's authentication assurance, as seen by the enforcement layer.
 */
export type SessionAcrState = {
  /** The ACR the session was last verified at. */
  acr?: string;
  /**
   * When the session's ACR was last established, in **seconds** since epoch (OIDC `auth_time`
   * semantics). Used together with {@link freshnessTtlSeconds} to expire a strong ACR.
   */
  acrEstablishedAt?: number;
};

/** Why a session does not satisfy a required ACR — drives the challenge vs. the issued claim. */
export enum AcrShortfallReason {
  /** The session's ACR rank is below the required ACR (needs a stronger factor). */
  Insufficient = 'insufficient',
  /** The session's ACR is strong enough but older than the freshness window (needs re-elevation). */
  Stale = 'stale',
}

/**
 * Decide whether a session satisfies a required ACR, accounting for both assurance level and
 * freshness. Returns `undefined` when satisfied, or the {@link AcrShortfallReason} when a step-up
 * challenge must be issued.
 *
 * @param now - current time in **seconds** since epoch (passed in so this stays pure/testable).
 * @param freshnessTtlSeconds - elevation window for the required ACR; `undefined` disables the
 *   freshness check (assurance-level only).
 */
export const evaluateAcr = (
  session: SessionAcrState,
  requiredAcr: string,
  now: number,
  freshnessTtlSeconds?: number
): AcrShortfallReason | undefined => {
  if (!acrSatisfies(session.acr, requiredAcr)) {
    return AcrShortfallReason.Insufficient;
  }

  if (
    freshnessTtlSeconds !== undefined &&
    (session.acrEstablishedAt === undefined || now - session.acrEstablishedAt > freshnessTtlSeconds)
  ) {
    return AcrShortfallReason.Stale;
  }

  return undefined;
};
