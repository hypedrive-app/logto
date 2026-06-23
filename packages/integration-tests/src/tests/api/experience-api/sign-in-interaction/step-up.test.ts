/**
 * Step-up authentication (RFC 9470) end-to-end coverage against a live tenant.
 *
 * The unit tests in `@logto/core` pin the trust boundary and token-claim integrity in isolation.
 * This suite exercises the *whole* round-trip through the real OIDC provider + experience API:
 *
 *   1. A user with an (optional) TOTP factor signs in normally, establishing a password-level
 *      OIDC session.
 *   2. The same client re-authorizes with `acr_values=urn:logto:acr:mfa`. Because a session
 *      already exists, the provider injects the `step_up_acr` extra param into the experience URL
 *      instead of starting a fresh login.
 *   3. The experience app bootstraps a step-up interaction. Submitting without MFA is rejected
 *      (403), and only after a verified TOTP does the provider issue a token — whose `acr` claim
 *      reflects what was actually performed.
 *
 * `NoPrompt` MFA policy is used so a TOTP-enrolled user can sign in *without* MFA: the established
 * session is genuinely below the `mfa` ACR, giving step-up something to enforce.
 */

import {
  ExtraParamsKey,
  InteractionEvent,
  LogtoAcrValues,
  MfaFactor,
  SignInIdentifier,
} from '@logto/schemas';
import { authenticator } from 'otplib';

import { createUserMfaVerification, updateUserLogtoConfig } from '#src/api/admin-user.js';
import { type ExperienceClient } from '#src/client/experience/index.js';
import { initExperienceClient, processSession } from '#src/helpers/client.js';
import { identifyUserWithUsernamePassword } from '#src/helpers/experience/index.js';
import { successfullyVerifyTotp } from '#src/helpers/experience/totp-verification.js';
import { expectRejects } from '#src/helpers/index.js';
import {
  enableAllPasswordSignInMethods,
  enableUserControlledMfaWithNoPrompt,
  resetMfaSettings,
} from '#src/helpers/sign-in-experience.js';
import { generateNewUserProfile, UserApiTest } from '#src/helpers/user.js';

/**
 * Create a user with a verified TOTP factor and complete a normal sign-in, leaving the returned
 * client holding an authenticated (password-level) OIDC session ready for a step-up authorization.
 */
const signInUserWithTotp = async (userApi: UserApiTest) => {
  const { username, password } = generateNewUserProfile({ username: true, password: true });
  const user = await userApi.create({ username, password });

  const totp = await createUserMfaVerification(user.id, MfaFactor.TOTP);
  if (totp.type !== MfaFactor.TOTP) {
    throw new Error('unexpected mfa type');
  }

  // The user has TOTP enrolled, which by default forces MFA at sign-in (`isMfaRequired` is true once
  // a user has any factor). Opt this user out so the baseline sign-in genuinely completes at password
  // level — the whole point of step-up is to elevate a session that is *below* the `mfa` ACR.
  await updateUserLogtoConfig(user.id, { mfa: { skipMfaOnSignIn: true } });

  const client = await initExperienceClient();
  await identifyUserWithUsernamePassword(client, username, password);
  // `NoPrompt` policy + per-user `skipMfaOnSignIn`: sign-in completes at password level.
  const { redirectTo } = await client.submitInteraction();
  await processSession(client, redirectTo);

  return { client, user, username, password, totpSecret: totp.secret };
};

/**
 * Drive a step-up interaction on a client that already holds an authenticated session: kick off the
 * step-up authorization, then bootstrap the experience-side interaction as a `SignIn` event (the
 * backend promotes it to `StepUp` from the injected `step_up_acr` param).
 */
const startStepUp = async (client: ExperienceClient, acrValues: string) => {
  const location = await client.startStepUpAuthorization(acrValues);
  await client.initInteraction({ interactionEvent: InteractionEvent.SignIn });
  return location;
};

describe('step-up authentication (RFC 9470)', () => {
  const userApi = new UserApiTest();

  beforeAll(async () => {
    await enableAllPasswordSignInMethods({
      identifiers: [SignInIdentifier.Username],
      password: true,
      verify: false,
    });
    await enableUserControlledMfaWithNoPrompt();
  });

  afterEach(async () => {
    await userApi.cleanUp();
  });

  afterAll(async () => {
    await resetMfaSettings();
  });

  it('injects `step_up_acr` into the experience URL when re-authorizing with an existing session', async () => {
    const { client } = await signInUserWithTotp(userApi);

    const location = await client.startStepUpAuthorization(LogtoAcrValues.Mfa);

    // The provider should route to the sign-in experience carrying the step-up marker, NOT start
    // a fresh identifier/password flow.
    expect(location).toContain('/sign-in');
    expect(location).toContain(
      `${ExtraParamsKey.StepUpAcr}=${encodeURIComponent(LogtoAcrValues.Mfa)}`
    );
  });

  it('rejects the step-up submit until the requested MFA factor is verified', async () => {
    const { client } = await signInUserWithTotp(userApi);

    await startStepUp(client, LogtoAcrValues.Mfa);

    // The step-up interaction reuses the session account but has no verified factor yet.
    await expectRejects(client.submitInteraction(), {
      code: 'session.mfa.require_mfa_verification',
      status: 403,
    });
  });

  it('issues a token with `acr: mfa` once the step-up TOTP is verified', async () => {
    const { client, totpSecret } = await signInUserWithTotp(userApi);

    await startStepUp(client, LogtoAcrValues.Mfa);

    await successfullyVerifyTotp(client, { code: authenticator.generate(totpSecret) });

    const { redirectTo } = await client.submitInteraction();
    expect(redirectTo).toBeTruthy();

    await processSession(client, redirectTo);

    const idToken = await client.getIdTokenClaims();
    // The issued token reports the ACR that was actually satisfied. `acr` is surfaced automatically
    // because the request carried `acr_values`; `amr` is set on the session by the backend but only
    // appears in the ID token when the client explicitly requests it via the `claims` parameter, so
    // it is intentionally not asserted on the demo-app token here.
    expect(idToken.acr).toBe(LogtoAcrValues.Mfa);
  });

  it('injects `step_up_acr` for the phishing-resistant (`phr`) ACR with an existing session', async () => {
    const { client } = await signInUserWithTotp(userApi);

    const location = await client.startStepUpAuthorization(LogtoAcrValues.PhishingResistant);

    expect(location).toContain('/sign-in');
    expect(location).toContain(
      `${ExtraParamsKey.StepUpAcr}=${encodeURIComponent(LogtoAcrValues.PhishingResistant)}`
    );
  });

  it('rejects a `phr` step-up for a TOTP-only user, offering no phishing-resistant factor', async () => {
    // The user has TOTP enrolled but no WebAuthn. A phishable factor can never satisfy `phr`, so the
    // submit is rejected and the available-factors payload is empty (no security key to offer).
    const { client } = await signInUserWithTotp(userApi);

    await startStepUp(client, LogtoAcrValues.PhishingResistant);

    await expectRejects(client.submitInteraction(), {
      code: 'session.mfa.require_mfa_verification',
      status: 403,
    });
  });

  it('does not inject `step_up_acr` for a first-time login (no existing session)', async () => {
    // A first-time authorization with `acr_values` is a normal login, not a step-up: the provider
    // has no session to satisfy, so the experience interaction must NOT carry the step-up marker.
    const client = await initExperienceClient({
      options: { extraParams: { acr_values: LogtoAcrValues.Mfa } },
    });

    expect(client.rawCookies.some((cookie) => cookie.includes('_session.sig'))).toBe(false);
    expect(client.interactionCookie).not.toContain(ExtraParamsKey.StepUpAcr);
  });
});
