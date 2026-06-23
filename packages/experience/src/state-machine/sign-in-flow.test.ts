import { initialSignInState, signInReducer, type SignInState } from './sign-in-flow';

describe('signInReducer', () => {
  it('starts at the identifier step', () => {
    expect(initialSignInState).toEqual({ step: 'identifier' });
  });

  it('routes the identifier to the chosen verification method', () => {
    const next = signInReducer(initialSignInState, {
      type: 'submitIdentifier',
      identifier: 'user@example.com',
      method: 'password',
    });

    expect(next).toEqual({ step: 'password', identifier: 'user@example.com' });
  });

  it('goes identifier → passkey → consent on a verified passkey with no MFA', () => {
    const afterIdentifier = signInReducer(initialSignInState, {
      type: 'submitIdentifier',
      identifier: 'a@b.com',
      method: 'passkey',
    });
    const afterVerified = signInReducer(afterIdentifier, {
      type: 'verified',
      mfaRequired: false,
      consentRequired: true,
    });

    expect(afterVerified).toEqual({ step: 'consent', identifier: 'a@b.com' });
  });

  it('inserts the MFA step before consent when MFA is required', () => {
    const password: SignInState = { step: 'password', identifier: 'a@b.com' };
    const next = signInReducer(password, {
      type: 'verified',
      mfaRequired: true,
      consentRequired: true,
    });

    expect(next).toEqual({ step: 'mfa', identifier: 'a@b.com' });
  });

  it('completes the flow with a redirect after consent', () => {
    const consent: SignInState = { step: 'consent', identifier: 'a@b.com' };
    const next = signInReducer(consent, {
      type: 'consentGranted',
      redirectTo: 'https://app.example.com/callback',
    });

    expect(next).toEqual({ step: 'done', redirectTo: 'https://app.example.com/callback' });
  });

  it('can fail from any step', () => {
    const password: SignInState = { step: 'password', identifier: 'a@b.com' };
    expect(signInReducer(password, { type: 'fail', reason: 'locked' })).toEqual({
      step: 'error',
      reason: 'locked',
    });
  });

  it('resets to identifier on back', () => {
    const mfa: SignInState = { step: 'mfa', identifier: 'a@b.com' };
    expect(signInReducer(mfa, { type: 'back' })).toEqual(initialSignInState);
  });

  it('ignores impossible transitions (no-op) instead of producing invalid state', () => {
    const identifier = initialSignInState;
    // `verified` makes no sense before an identifier method is chosen — state is unchanged.
    expect(
      signInReducer(identifier, { type: 'verified', mfaRequired: false, consentRequired: false })
    ).toBe(identifier);
  });

  it('keeps terminal states stable', () => {
    const done: SignInState = { step: 'done', redirectTo: 'x' };
    expect(signInReducer(done, { type: 'consentGranted', redirectTo: 'y' })).toBe(done);
  });
});
