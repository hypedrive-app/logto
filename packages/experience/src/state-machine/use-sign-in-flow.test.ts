import { act, renderHook } from '@testing-library/react';

import { useSignInFlow } from './use-sign-in-flow';

describe('useSignInFlow', () => {
  it('starts at the identifier step and is not terminal', () => {
    const { result } = renderHook(() => useSignInFlow());

    expect(result.current.state).toEqual({ step: 'identifier' });
    expect(result.current.isTerminal).toBe(false);
  });

  it('drives the flow forward via send', () => {
    const { result } = renderHook(() => useSignInFlow());

    act(() => {
      result.current.send({
        type: 'submitIdentifier',
        identifier: 'user@example.com',
        method: 'password',
      });
    });
    expect(result.current.state).toEqual({ step: 'password', identifier: 'user@example.com' });

    act(() => {
      result.current.send({ type: 'verified', mfaRequired: false, consentRequired: true });
    });
    expect(result.current.state).toEqual({ step: 'consent', identifier: 'user@example.com' });

    act(() => {
      result.current.send({ type: 'consentGranted', redirectTo: 'https://app/cb' });
    });
    expect(result.current.state).toEqual({ step: 'done', redirectTo: 'https://app/cb' });
    expect(result.current.isTerminal).toBe(true);
  });

  it('reset() returns to the identifier step', () => {
    const { result } = renderHook(() => useSignInFlow());

    act(() => {
      result.current.send({ type: 'submitIdentifier', identifier: 'a@b.com', method: 'passkey' });
    });
    expect(result.current.state.step).toBe('passkey');

    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toEqual({ step: 'identifier' });
  });
});
