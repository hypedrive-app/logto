/* eslint-disable max-lines */
/**
 * Step-up authentication (RFC 9470) coverage for {@link ExperienceInteraction}.
 *
 * These tests focus on the security-critical guarantees of the step-up flow:
 *
 *  - the issued token's `acr` / `amr` claims reflect what was *actually* verified
 *    (never a higher assurance level than performed);
 *  - MFA is enforced for the `urn:logto:acr:mfa` ACR before a token is issued;
 *  - CAPTCHA is skipped for step-up (the existing session is the proof of prior verification);
 *  - `stepUpAcr` survives the storage round-trip and an invalid stored value is rejected.
 */

import {
  InteractionEvent,
  LogtoAcrValues,
  MfaFactor,
  type SignInExperience,
  type User,
  VerificationType,
} from '@logto/schemas';
import { createMockUtils, pickDefault } from '@logto/shared/esm';

import { mockSignInExperience } from '#src/__mocks__/sign-in-experience.js';
import {
  mockUser,
  mockUserWebAuthnMfaVerification,
  mockUserWithMfaVerifications,
} from '#src/__mocks__/user.js';
import RequestError from '#src/errors/RequestError/index.js';
import { createMockLogContext } from '#src/test-utils/koa-audit-log.js';
import { createMockProvider } from '#src/test-utils/oidc-provider.js';
import { MockTenant } from '#src/test-utils/tenant.js';
import { createContextWithRouteParameters } from '#src/utils/test-utils.js';

import { type Interaction, type WithHooksAndLogsContext } from '../types.js';

import { TotpVerification } from './verifications/totp-verification.js';
import { WebAuthnVerification } from './verifications/web-authn-verification.js';

/** A user enrolled with a WebAuthn (phishing-resistant) factor plus a phishable TOTP factor. */
const mockUserWithWebAuthn: User = {
  ...mockUserWithMfaVerifications,
  mfaVerifications: [
    ...mockUserWithMfaVerifications.mfaVerifications,
    mockUserWebAuthnMfaVerification,
  ],
};

const { jest } = import.meta;
const { mockEsm } = createMockUtils(jest);

mockEsm('#src/utils/tenant.js', () => ({
  getTenantId: () => ['mock_tenant'],
}));

const userLibraries = {
  generateUserId: jest.fn().mockResolvedValue('uid'),
  insertUser: jest.fn(),
  provisionOrganizations: jest.fn().mockResolvedValue([]),
};

const ssoConnectors = {
  getAvailableSsoConnectors: jest.fn().mockResolvedValue([]),
};

const ExperienceInteraction = await pickDefault(import('./experience-interaction.js'));

/**
 * Build a step-up {@link ExperienceInteraction} restored from OIDC interaction storage, returning
 * the interaction plus the `interactionResult` spy so callers can assert the issued `login` claims.
 */
const createStepUpInteraction = ({
  acr = LogtoAcrValues.Mfa,
  user = mockUserWithMfaVerifications,
  mfaFactors = [MfaFactor.TOTP],
  storedResult = {},
}: {
  acr?: string;
  user?: User;
  mfaFactors?: MfaFactor[];
  storedResult?: Record<string, unknown>;
} = {}) => {
  const signInExperiences = {
    findDefaultSignInExperience: jest.fn().mockResolvedValue({
      ...mockSignInExperience,
      mfa: { ...mockSignInExperience.mfa, factors: mfaFactors },
    } satisfies SignInExperience),
  };

  const users = {
    findUserById: jest.fn().mockResolvedValue(user),
    updateUserById: jest.fn().mockResolvedValue(user),
    hasActiveUsers: jest.fn().mockResolvedValue(true),
  };

  const interactionResultSpy = jest.fn().mockResolvedValue('redirectTo');
  const provider = createMockProvider();
  jest.spyOn(provider, 'interactionResult').mockImplementation(interactionResultSpy);

  const tenant = new MockTenant(
    provider,
    { users, signInExperiences },
    undefined,
    { users: userLibraries, ssoConnectors }
  );

  const logContext = createMockLogContext();
  // @ts-expect-error -- mock test context
  const ctx: WithHooksAndLogsContext = {
    assignReleaseOnSuccessInteractionHookResult: jest.fn(),
    assignReleaseAnywayInteractionHookResult: jest.fn(),
    appendDataHookContext: jest.fn(),
    appendExceptionHookContext: jest.fn(),
    ...createContextWithRouteParameters(),
    ...logContext,
  };

  const interactionDetails = {
    result: {
      interactionEvent: InteractionEvent.StepUp,
      userId: user.id,
      stepUpAcr: acr,
      ...storedResult,
    },
  } as unknown as Interaction;

  const experienceInteraction = new ExperienceInteraction(ctx, tenant, interactionDetails);

  return { experienceInteraction, interactionResultSpy, ctx, tenant, users };
};

/** Attach a verified TOTP MFA record to the interaction (no secret → not a new-bind record). */
const setVerifiedTotp = (
  experienceInteraction: InstanceType<typeof ExperienceInteraction>,
  tenant: MockTenant,
  userId: string
) => {
  const record = new TotpVerification(tenant.libraries, tenant.queries, {
    id: 'verified_totp',
    type: VerificationType.TOTP,
    userId,
    verified: true,
  });
  experienceInteraction.setVerificationRecord(record);
};

/**
 * Attach a verified WebAuthn MFA record (no `registrationChallenge` → not a new-bind record), so it
 * counts as a phishing-resistant factor satisfied in this interaction.
 */
const setVerifiedWebAuthn = (
  experienceInteraction: InstanceType<typeof ExperienceInteraction>,
  tenant: MockTenant,
  userId: string
) => {
  const record = new WebAuthnVerification(tenant.libraries, tenant.queries, {
    id: 'verified_webauthn',
    type: VerificationType.WebAuthn,
    userId,
    verified: true,
  });
  experienceInteraction.setVerificationRecord(record);
};

describe('ExperienceInteraction step-up', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initStepUp', () => {
    it('promotes a sign-in interaction to step-up and pins the account + ACR', () => {
      const { experienceInteraction } = createStepUpInteraction();

      experienceInteraction.initStepUp(mockUser.id, LogtoAcrValues.Mfa);

      expect(experienceInteraction.interactionEvent).toBe(InteractionEvent.StepUp);
      expect(experienceInteraction.identifiedUserId).toBe(mockUser.id);
    });
  });

  describe('storage round-trip', () => {
    it('restores `stepUpAcr` from storage and echoes it back via toJson', () => {
      const { experienceInteraction } = createStepUpInteraction({ acr: LogtoAcrValues.Mfa });

      expect(experienceInteraction.interactionEvent).toBe(InteractionEvent.StepUp);
      expect(experienceInteraction.toJson().stepUpAcr).toBe(LogtoAcrValues.Mfa);
    });

    it('rejects an invalid stored `stepUpAcr` during parsing', () => {
      expect(() =>
        createStepUpInteraction({ acr: 'urn:logto:acr:not-a-real-acr' })
      ).toThrowError();
    });
  });

  describe('submit() — token claims integrity', () => {
    it('requires MFA for the `mfa` ACR and issues `acr: mfa` once verified', async () => {
      const { experienceInteraction, interactionResultSpy, tenant } = createStepUpInteraction({
        acr: LogtoAcrValues.Mfa,
        user: mockUserWithMfaVerifications,
      });

      setVerifiedTotp(experienceInteraction, tenant, mockUserWithMfaVerifications.id);

      await experienceInteraction.submit();

      expect(interactionResultSpy).toHaveBeenCalledTimes(1);
      const [, , result] = interactionResultSpy.mock.calls[0]!;
      expect(result.login.acr).toBe(LogtoAcrValues.Mfa);
      expect(result.login.amr).toContain('mfa');
      expect(result.login.amr).toContain('totp');
    });

    it('throws 403 require_mfa_verification when the `mfa` ACR is requested but MFA is not verified', async () => {
      const { experienceInteraction, interactionResultSpy } = createStepUpInteraction({
        acr: LogtoAcrValues.Mfa,
        user: mockUserWithMfaVerifications,
      });

      // No verified MFA record attached. The error also surfaces the user's available factors.
      await expect(experienceInteraction.submit()).rejects.toMatchError(
        new RequestError(
          { code: 'session.mfa.require_mfa_verification', status: 403 },
          { availableFactors: [MfaFactor.TOTP] }
        )
      );
      expect(interactionResultSpy).not.toHaveBeenCalled();
    });

    it('does NOT claim a higher ACR/AMR than verified for a baseline `pwd` step-up', async () => {
      // A `pwd` step-up is already satisfied by the existing session; no MFA is collected.
      const { experienceInteraction, interactionResultSpy } = createStepUpInteraction({
        acr: LogtoAcrValues.Password,
        user: mockUser,
      });

      await experienceInteraction.submit();

      expect(interactionResultSpy).toHaveBeenCalledTimes(1);
      const [, , result] = interactionResultSpy.mock.calls[0]!;
      // The token must report the ACR that was actually satisfied — never `mfa`.
      expect(result.login.acr).toBe(LogtoAcrValues.Password);
      // And `amr` must not falsely assert `mfa` when no factor was verified.
      expect(result.login.amr).not.toContain('mfa');
      expect(result.login.amr).toStrictEqual([]);
    });
  });

  describe('submit() — phishing-resistant (`phr`) ACR', () => {
    it('issues `acr: phr` and `amr: [mfa, hwk]` once a WebAuthn factor is verified', async () => {
      const { experienceInteraction, interactionResultSpy, tenant } = createStepUpInteraction({
        acr: LogtoAcrValues.PhishingResistant,
        user: mockUserWithWebAuthn,
        mfaFactors: [MfaFactor.TOTP, MfaFactor.WebAuthn],
      });

      setVerifiedWebAuthn(experienceInteraction, tenant, mockUserWithWebAuthn.id);

      await experienceInteraction.submit();

      expect(interactionResultSpy).toHaveBeenCalledTimes(1);
      const [, , result] = interactionResultSpy.mock.calls[0]!;
      expect(result.login.acr).toBe(LogtoAcrValues.PhishingResistant);
      expect(result.login.amr).toContain('mfa');
      expect(result.login.amr).toContain('hwk');
    });

    it('rejects a verified TOTP factor for `phr` and offers ONLY the WebAuthn factor', async () => {
      const { experienceInteraction, interactionResultSpy, tenant } = createStepUpInteraction({
        acr: LogtoAcrValues.PhishingResistant,
        user: mockUserWithWebAuthn,
        mfaFactors: [MfaFactor.TOTP, MfaFactor.WebAuthn],
      });

      // A phishable factor must NOT satisfy `phr`, even though the user enrolled it.
      setVerifiedTotp(experienceInteraction, tenant, mockUserWithWebAuthn.id);

      await expect(experienceInteraction.submit()).rejects.toMatchError(
        new RequestError(
          { code: 'session.mfa.require_mfa_verification', status: 403 },
          // Available factors are scoped to the phishing-resistant subset — WebAuthn only.
          { availableFactors: [MfaFactor.WebAuthn] }
        )
      );
      expect(interactionResultSpy).not.toHaveBeenCalled();
    });

    it('throws 403 with no available factors when `phr` is requested but no WebAuthn is enrolled', async () => {
      const { experienceInteraction, interactionResultSpy } = createStepUpInteraction({
        acr: LogtoAcrValues.PhishingResistant,
        user: mockUserWithMfaVerifications, // TOTP only — no WebAuthn.
        mfaFactors: [MfaFactor.TOTP],
      });

      await expect(experienceInteraction.submit()).rejects.toMatchError(
        new RequestError(
          { code: 'session.mfa.require_mfa_verification', status: 403 },
          { availableFactors: [] }
        )
      );
      expect(interactionResultSpy).not.toHaveBeenCalled();
    });
  });

  describe('guardCaptcha', () => {
    it('skips the CAPTCHA check for step-up interactions', async () => {
      const { experienceInteraction } = createStepUpInteraction();

      // Should resolve without consulting the sign-in-experience CAPTCHA settings.
      await expect(experienceInteraction.guardCaptcha()).resolves.toBeUndefined();
    });
  });
});
