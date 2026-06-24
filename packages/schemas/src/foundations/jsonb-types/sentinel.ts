import { z } from 'zod';

/** The action target type of a sentinel activity. */
export enum SentinelActivityTargetType {
  User = 'User',
  App = 'App',
}
export const sentinelActivityTargetTypeGuard = z.nativeEnum(SentinelActivityTargetType);

/** The action type of a sentinel activity. */
export enum SentinelActivityAction {
  /**
   * The subject tries to pass a verification by inputting a password.
   *
   * For example, a user (subject) who inputted a password (action) to authenticate themselves
   * (target).
   */
  Password = 'Password',
  /**
   * The subject tries to pass a verification by inputting a verification code.
   *
   * For example, a user (subject) who inputted a verification code (action) to authenticate
   * themselves (target).
   */
  VerificationCode = 'VerificationCode',
  /**
   * The subject tries to pass a verification by inputting a one-time token.
   *
   * For example, a user (subject) who inputted a one-time token (action) to authenticate
   * themselves (target), e.g. Magic Link.
   */
  OneTimeToken = 'OneTimeToken',
  /**
   * The subject tries to pass a TOTP MFA verification.
   */
  MfaTotp = 'MfaTotp',
  /**
   * The subject tries to pass a WebAuthn MFA verification.
   */
  WebAuthn = 'WebAuthn',
  /**
   * The subject tries to pass a backup code MFA verification.
   */
  MfaBackupCode = 'MfaBackupCode',
  /**
   * A verification code is sent to the target (email/phone), e.g. sign-in,
   * register, forgot-password, or identifier-binding codes.
   *
   * Used by the message rate limit to throttle sends, distinct from the
   * failure-based lockout actions above.
   */
  VerificationCodeSend = 'VerificationCodeSend',
  /**
   * A non-verification-code message is sent to the target (email/phone),
   * e.g. an organization invitation.
   *
   * Used by the message rate limit to throttle sends.
   */
  MessageSend = 'MessageSend',
  /**
   * A step-up (RFC 9470) challenge was issued to the subject because the current session's ACR
   * did not satisfy the ACR required by the requested scope / resource.
   *
   * Kept isolated from the primary sign-in actions so step-up traffic can be risk-scored
   * separately and never leaks lockouts across unrelated verification stages.
   */
  StepUpChallenged = 'StepUpChallenged',
  /**
   * The subject completed a step-up challenge, raising the session ACR to the required level.
   */
  StepUpPassed = 'StepUpPassed',
  /**
   * The subject failed a step-up challenge (wrong/expired factor, or an insufficient factor for
   * the required ACR, e.g. a phishable factor where phishing-resistant was required).
   */
  StepUpFailed = 'StepUpFailed',
}
export const sentinelActivityActionGuard = z.nativeEnum(SentinelActivityAction);

export type SentinelActivityPayload = Record<string, unknown>;
export const sentinelActivityPayloadGuard = z.record(
  z.string(),
  z.unknown()
) satisfies z.ZodType<SentinelActivityPayload>;
