import { ExtraParamsKey, LogtoAcrValues } from '@logto/schemas';
import { renderHook } from '@testing-library/react-hooks';
import * as reactRouterDom from 'react-router-dom';

import useStepUpAcr from './use-step-up-acr';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));

const mockSearchParams = (params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params);
  (reactRouterDom.useSearchParams as jest.Mock).mockReturnValue([searchParams]);
};

describe('useStepUpAcr', () => {
  it('returns undefined when no step_up_acr param is present', () => {
    mockSearchParams({});
    const { result } = renderHook(() => useStepUpAcr());
    expect(result.current).toBeUndefined();
  });

  it('returns the ACR when a supported step_up_acr is present', () => {
    mockSearchParams({ [ExtraParamsKey.StepUpAcr]: LogtoAcrValues.Mfa });
    const { result } = renderHook(() => useStepUpAcr());
    expect(result.current).toBe(LogtoAcrValues.Mfa);
  });

  it('returns the baseline Password ACR when requested', () => {
    mockSearchParams({ [ExtraParamsKey.StepUpAcr]: LogtoAcrValues.Password });
    const { result } = renderHook(() => useStepUpAcr());
    expect(result.current).toBe(LogtoAcrValues.Password);
  });

  it('returns the phishing-resistant ACR when requested', () => {
    mockSearchParams({ [ExtraParamsKey.StepUpAcr]: LogtoAcrValues.PhishingResistant });
    const { result } = renderHook(() => useStepUpAcr());
    expect(result.current).toBe(LogtoAcrValues.PhishingResistant);
  });

  it('returns undefined for an unsupported acr value', () => {
    mockSearchParams({ [ExtraParamsKey.StepUpAcr]: 'urn:example:unsupported' });
    const { result } = renderHook(() => useStepUpAcr());
    expect(result.current).toBeUndefined();
  });

  it('returns undefined for an empty step_up_acr value', () => {
    mockSearchParams({ [ExtraParamsKey.StepUpAcr]: '' });
    const { result } = renderHook(() => useStepUpAcr());
    expect(result.current).toBeUndefined();
  });
});
