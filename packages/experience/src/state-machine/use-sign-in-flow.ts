import { useCallback, useMemo, useReducer } from 'react';

import { initialSignInState, signInReducer } from './sign-in-flow';

/**
 * React binding for the sign-in flow state machine.
 *
 * Wraps the pure `signInReducer` in `useReducer` and exposes a small, typed API:
 * the current state, a `send` dispatcher, and a few convenience helpers. This is the
 * intended integration point — a screen/route can read `state.step` to decide what to
 * render and call `send({...})` on user actions, instead of inferring the flow from
 * scattered routes and context. It is additive: adopt it per-flow without touching the
 * existing router.
 */
export const useSignInFlow = () => {
  const [state, send] = useReducer(signInReducer, initialSignInState);

  const reset = useCallback(() => {
    send({ type: 'back' });
  }, []);

  return useMemo(
    () => ({
      state,
      send,
      reset,
      /** True once the flow has reached a terminal state. */
      isTerminal: state.step === 'done' || state.step === 'error',
    }),
    [state, reset]
  );
};

export type { SignInState, SignInEvent } from './sign-in-flow';
