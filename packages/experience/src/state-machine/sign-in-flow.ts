/**
 * Sign-in flow state machine (typed, dependency-free).
 *
 * Today the sign-in flow is implicit — spread across routes, page components and several
 * context providers, so "what step am I on and where can I go next" can only be inferred by
 * reading many files. This module models the flow EXPLICITLY as a small, pure, fully-testable
 * state machine: states + the events that transition between them.
 *
 * It is intentionally additive — it does not replace the existing router. It can be adopted
 * incrementally (drive a `useReducer`, derive the active route from the state, or just use it
 * as the single source of truth for "what's the next screen"). Being a pure reducer it needs
 * no runtime library (XState etc.) and is trivial to unit-test, which is the whole point:
 * impossible transitions become unrepresentable instead of being guarded ad-hoc in components.
 */

/** Every distinct screen/phase a user can be on during sign-in. */
export type SignInState =
  | { step: 'identifier' }
  | { step: 'password'; identifier: string }
  | { step: 'verificationCode'; identifier: string }
  | { step: 'passkey'; identifier: string }
  | { step: 'singleSignOn'; identifier: string }
  | { step: 'mfa'; identifier: string }
  | { step: 'consent'; identifier: string }
  | { step: 'done'; redirectTo: string }
  | { step: 'error'; reason: string };

/** The verification method chosen after an identifier is submitted. */
export type VerificationMethod = 'password' | 'verificationCode' | 'passkey' | 'singleSignOn';

/** Events that drive transitions. The reducer is the only place flow logic lives. */
export type SignInEvent =
  | { type: 'submitIdentifier'; identifier: string; method: VerificationMethod }
  | { type: 'verified'; mfaRequired: boolean; consentRequired: boolean }
  | { type: 'mfaPassed'; consentRequired: boolean }
  | { type: 'consentGranted'; redirectTo: string }
  | { type: 'fail'; reason: string }
  | { type: 'back' };

export const initialSignInState: SignInState = { step: 'identifier' };

/**
 * Build the next state for a chosen verification method. Returning fully-formed,
 * discriminated state objects (rather than just a `step` string) keeps the result
 * precisely typed — no type assertion needed at the call site.
 */
const methodToState: Record<VerificationMethod, (identifier: string) => SignInState> = {
  password: (identifier) => ({ step: 'password', identifier }),
  verificationCode: (identifier) => ({ step: 'verificationCode', identifier }),
  passkey: (identifier) => ({ step: 'passkey', identifier }),
  singleSignOn: (identifier) => ({ step: 'singleSignOn', identifier }),
};

/**
 * Resolve where to go once a credential has been verified: MFA first if required,
 * otherwise the consent step (which itself resolves to the redirect when no consent
 * is actually needed). `consentRequired` is accepted for symmetry with the events and
 * to keep the call sites self-documenting.
 */
const afterVerification = (identifier: string, mfaRequired: boolean): SignInState =>
  mfaRequired ? { step: 'mfa', identifier } : { step: 'consent', identifier };

/**
 * Pure transition function. Given the current state and an event, returns the next state.
 * Unknown (state, event) combinations are ignored (state unchanged), so impossible
 * transitions simply can't happen.
 */
export const signInReducer = (state: SignInState, event: SignInEvent): SignInState => {
  // `fail` and `back` are valid from anywhere.
  if (event.type === 'fail') {
    return { step: 'error', reason: event.reason };
  }

  if (event.type === 'back') {
    return initialSignInState;
  }

  switch (state.step) {
    case 'identifier': {
      if (event.type === 'submitIdentifier') {
        return methodToState[event.method](event.identifier);
      }
      return state;
    }

    case 'password':
    case 'verificationCode':
    case 'passkey':
    case 'singleSignOn': {
      if (event.type === 'verified') {
        return afterVerification(state.identifier, event.mfaRequired);
      }
      return state;
    }

    case 'mfa': {
      if (event.type === 'mfaPassed') {
        // After MFA we always pass through the consent step; the consent screen itself
        // resolves immediately to the redirect when no consent is actually required.
        return { step: 'consent', identifier: state.identifier };
      }
      return state;
    }

    case 'consent': {
      if (event.type === 'consentGranted') {
        return { step: 'done', redirectTo: event.redirectTo };
      }
      return state;
    }

    case 'done':
    case 'error': {
      // Terminal states — only `back`/`fail` (handled above) can move out of them.
      return state;
    }
  }
};
