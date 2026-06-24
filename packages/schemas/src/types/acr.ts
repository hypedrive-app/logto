import { acrSatisfies } from '../consts/oidc.js';

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
