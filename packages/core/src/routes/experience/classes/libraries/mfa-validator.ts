import {
  MfaFactor,
  VerificationType,
  userMfaDataGuard,
  userMfaDataKey,
  type Mfa,
  type User,
} from '@logto/schemas';
import { type Optional } from '@silverhand/essentials';

import { isNoSkipMfaPolicy } from '#src/libraries/sign-in-experience/mfa-policy.js';

import { getAllUserEnabledMfaVerifications } from '../helpers.js';
import { type BackupCodeVerification } from '../verifications/backup-code-verification.js';
import {
  type MfaEmailCodeVerification,
  type MfaPhoneCodeVerification,
} from '../verifications/code-verification.js';
import { type VerificationRecord } from '../verifications/index.js';
import { type TotpVerification } from '../verifications/totp-verification.js';
import { type WebAuthnVerification } from '../verifications/web-authn-verification.js';

import type { AdaptiveMfaResult } from './adaptive-mfa-validator/types.js';

const mfaVerificationTypes = Object.freeze([
  VerificationType.TOTP,
  VerificationType.BackupCode,
  VerificationType.WebAuthn,
  VerificationType.MfaEmailVerificationCode,
  VerificationType.MfaPhoneVerificationCode,
]);

type MfaVerificationType =
  | VerificationType.TOTP
  | VerificationType.BackupCode
  | VerificationType.WebAuthn
  | VerificationType.MfaEmailVerificationCode
  | VerificationType.MfaPhoneVerificationCode;

const mfaVerificationTypeToMfaFactorMap = Object.freeze({
  [VerificationType.TOTP]: MfaFactor.TOTP,
  [VerificationType.BackupCode]: MfaFactor.BackupCode,
  [VerificationType.WebAuthn]: MfaFactor.WebAuthn,
  [VerificationType.MfaEmailVerificationCode]: MfaFactor.EmailVerificationCode,
  [VerificationType.MfaPhoneVerificationCode]: MfaFactor.PhoneVerificationCode,
}) satisfies Record<MfaVerificationType, MfaFactor>;

type MfaVerificationRecord =
  | TotpVerification
  | WebAuthnVerification
  | BackupCodeVerification
  | MfaEmailCodeVerification
  | MfaPhoneCodeVerification;

const isMfaVerificationRecord = (
  verification: VerificationRecord
): verification is MfaVerificationRecord => {
  return mfaVerificationTypes.includes(verification.type);
};

export class MfaValidator {
  constructor(
    private readonly mfaSettings: Mfa,
    private readonly user: User,
    private readonly adaptiveMfaResult?: Optional<AdaptiveMfaResult>
  ) {}

  /**
   * Get the enabled MFA factors for the user
   *
   * - Filter out MFA factors that are not configured in the sign-in experience
   * - Include implicit Email and Phone MFA factors if user has them and they're enabled in SIE
   */
  get userEnabledMfaVerifications() {
    return getAllUserEnabledMfaVerifications(this.mfaSettings, this.user);
  }

  /**
   * For front-end display usage only.
   * Returns all the available MFA verifications for the user that can be used for verification.
   *
   * - Filter out backup codes if all the codes are used
   * - Filter out duplicated verifications with the same type
   * - Sort by last used time, the latest used factor is the first one, backup code is always the last one
   */
  get availableUserMfaVerificationTypes() {
    return (
      this.userEnabledMfaVerifications
        // Filter out duplicated verifications with the same type
        .reduce<MfaFactor[]>((verifications, verification) => {
          if (verifications.includes(verification)) {
            return verifications;
          }

          return [...verifications, verification];
        }, [])
    );
  }

  /**
   * Whether MFA verification is required for the current sign-in interaction.
   *
   * Decision order:
   * 1. If adaptive MFA is enabled (result defined):
   *    - triggered + user has factors → required
   *    - otherwise → not required
   * 2. If adaptive MFA is disabled (result undefined), fall back to SIE policy:
   *    - skipMfaOnSignIn + non-Mandatory policy → not required
   *    - user has factors → required
   *    - otherwise → not required
   */
  get isMfaRequired(): boolean {
    const hasUserFactors = this.userEnabledMfaVerifications.length > 0;

    if (this.adaptiveMfaResult !== undefined) {
      // Verification guard only applies when the user already has MFA factors
      // enabled in the current sign-in experience.
      return this.adaptiveMfaResult.requiresMfa && hasUserFactors;
    }

    const mfaData = userMfaDataGuard.safeParse(this.user.logtoConfig[userMfaDataKey]);
    const skipMfaOnSignIn = mfaData.success ? mfaData.data.skipMfaOnSignIn : undefined;
    const isMfaEnabled = mfaData.success ? mfaData.data.enabled : undefined;

    // If `isMfaEnabled` is undefined, it means the user exists before the `enabled` flag is introduced,
    // we should still enforce MFA for them if they have MFA factors. Only skip the check if mfa is explicitly
    // disabled, or skipped on sign-in.
    if (
      (isMfaEnabled === false || skipMfaOnSignIn) &&
      !isNoSkipMfaPolicy(this.mfaSettings.policy)
    ) {
      return false;
    }

    return hasUserFactors;
  }

  /**
   * The phishing-resistant subset of the user's available MFA factors.
   *
   * Only WebAuthn (passkey / hardware security key) is phishing-resistant; phishable factors
   * (TOTP, email/SMS codes, backup codes) are excluded even when enrolled. Used to populate
   * the `availableFactors` payload of the step-up `phr` 403 so the experience app offers only
   * the security key.
   */
  get availablePhishingResistantFactors() {
    return this.availableUserMfaVerificationTypes.filter((factor) => factor === MfaFactor.WebAuthn);
  }

  isMfaVerified(verificationRecords: VerificationRecord[]) {
    return this.getVerifiedMfaRecords(verificationRecords).length > 0;
  }

  /**
   * Whether a phishing-resistant factor has been verified in this interaction.
   *
   * Satisfied only by a verified WebAuthn record that is enabled in the user's MFA settings.
   * Used to guard the `urn:logto:acr:phr` step-up ACR.
   */
  isPhishingResistantVerified(verificationRecords: VerificationRecord[]) {
    return this.getVerifiedMfaRecords(verificationRecords).some(
      (verification) => verification.type === VerificationType.WebAuthn
    );
  }

  /**
   * The verified, usable MFA records for this interaction: verified, not a fresh bind, and of a
   * type enabled in the user's MFA settings.
   */
  private getVerifiedMfaRecords(verificationRecords: VerificationRecord[]) {
    return verificationRecords.filter(
      (verification): verification is MfaVerificationRecord =>
        isMfaVerificationRecord(verification) &&
        verification.isVerified &&
        // New bind MFA verification can not be used for verification
        !verification.isNewBindMfaVerification &&
        // Check if the verification type is enabled in the user's MFA settings
        this.userEnabledMfaVerifications.includes(
          mfaVerificationTypeToMfaFactorMap[verification.type]
        )
    );
  }
}
