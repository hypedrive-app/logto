/**
 * Coverage for {@link MfaFactorList}'s phishing-resistant (`phr`) factor filtering.
 *
 * For a `phr` step-up only WebAuthn satisfies the requested ACR, so the selector must hide
 * phishable factors even when the user has them enrolled. For every other flow (including the
 * `mfa` step-up and binding) all available factors are shown unchanged.
 */

import { LogtoAcrValues, MfaFactor, type LogtoAcrValue } from '@logto/schemas';
import { render } from '@testing-library/react';

import { UserMfaFlow } from '@/types';
import { type MfaFlowState } from '@/types/guard';

import MfaFactorList from '.';

const mfaFactorButton = jest.fn();

// Controls the ACR the container reads via `useStepUpAcr`.
// eslint-disable-next-line @silverhand/fp/no-let
let mockStepUpAcr: LogtoAcrValue | undefined;

jest.mock('@/hooks/use-step-up-acr', () => ({
  __esModule: true,
  default: () => mockStepUpAcr,
}));

jest.mock('@/components/Button/MfaFactorButton', () => ({
  __esModule: true,
  default: (props: { factor: MfaFactor }) => {
    mfaFactorButton(props);
    return <div>{`factor-${props.factor}`}</div>;
  },
}));

// The select-factor side effects are irrelevant to filtering; stub the orchestration hooks.
jest.mock('@/hooks/use-navigate-with-preserved-search-params', () => ({
  __esModule: true,
  default: () => jest.fn(),
}));
jest.mock('@/hooks/use-send-mfa-verification-code', () => ({
  __esModule: true,
  default: () => ({ onSubmit: jest.fn() }),
}));
jest.mock('@/hooks/use-start-totp-binding', () => ({ __esModule: true, default: () => jest.fn() }));
jest.mock('@/hooks/use-start-webauthn-processing', () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

const renderedFactors = () =>
  mfaFactorButton.mock.calls.map(([props]: [{ factor: MfaFactor }]) => props.factor);

const allFactors: MfaFlowState = {
  availableFactors: [MfaFactor.WebAuthn, MfaFactor.TOTP, MfaFactor.BackupCode],
};

describe('<MfaFactorList /> phishing-resistant filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = undefined;
  });

  it('renders only the WebAuthn factor for a `phr` step-up', () => {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = LogtoAcrValues.PhishingResistant;

    render(<MfaFactorList flow={UserMfaFlow.MfaVerification} flowState={allFactors} />);

    expect(renderedFactors()).toStrictEqual([MfaFactor.WebAuthn]);
  });

  it('renders all available factors for an `mfa` step-up', () => {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = LogtoAcrValues.Mfa;

    render(<MfaFactorList flow={UserMfaFlow.MfaVerification} flowState={allFactors} />);

    expect(renderedFactors()).toStrictEqual([
      MfaFactor.WebAuthn,
      MfaFactor.TOTP,
      MfaFactor.BackupCode,
    ]);
  });

  it('renders all available factors when there is no step-up ACR', () => {
    render(<MfaFactorList flow={UserMfaFlow.MfaVerification} flowState={allFactors} />);

    expect(renderedFactors()).toStrictEqual([
      MfaFactor.WebAuthn,
      MfaFactor.TOTP,
      MfaFactor.BackupCode,
    ]);
  });
});
