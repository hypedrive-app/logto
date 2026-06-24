import { Prompt, useLogto } from '@logto/react';
import { ExtraParamsKey } from '@logto/schemas';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { saveRedirect } from '@/utils/storage';

import OneTimeTokenLanding from '.';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/use-redirect-uri', () => ({
  __esModule: true,
  default: vi.fn(() => new URL('/callback', window.location.origin)),
}));

vi.mock('@logto/react', () => ({
  Prompt: {
    Consent: 'consent',
    Login: 'login',
  },
  useLogto: vi.fn(),
}));

vi.mock('@/utils/storage', () => ({
  saveRedirect: vi.fn(),
}));

const mockedUseLogto = vi.mocked(useLogto);
const mockedSaveRedirect = vi.mocked(saveRedirect);

type OneTimeTokenSignInOptions = {
  redirectUri: URL;
  clearTokens: false;
  prompt: typeof Prompt.Consent;
  extraParams: {
    [ExtraParamsKey.OneTimeToken]: string;
    [ExtraParamsKey.LoginHint]: string;
  };
};

const renderOneTimeTokenLanding = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <OneTimeTokenLanding />
    </MemoryRouter>
  );

describe('OneTimeTokenLanding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('waits for Logto auth loading before starting the one-time-token flow', () => {
    const signIn = vi.fn();
    mockedUseLogto.mockReturnValue({
      isLoading: true,
      signIn,
    } as unknown as ReturnType<typeof useLogto>);

    renderOneTimeTokenLanding('/one-time-token?one_time_token=token&email=foo%40example.com');

    expect(signIn).not.toHaveBeenCalled();
    expect(mockedSaveRedirect).not.toHaveBeenCalled();
  });

  it('starts one-time-token sign-in with consent prompt and keeps existing tokens', async () => {
    const signIn = vi.fn();
    mockedUseLogto.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      signIn,
    } as unknown as ReturnType<typeof useLogto>);

    renderOneTimeTokenLanding(
      '/one-time-token?one_time_token=token&email=foo%40example.com&redirect=https%3A%2F%2Fconsole.logto.io%2Faccept%2Finvitation-id'
    );

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledTimes(1);
    });

    const [options] = signIn.mock.calls[0] as [OneTimeTokenSignInOptions];

    expect(options).toMatchObject({
      clearTokens: false,
      prompt: Prompt.Consent,
      extraParams: {
        [ExtraParamsKey.OneTimeToken]: 'token',
        [ExtraParamsKey.LoginHint]: 'foo@example.com',
      },
    });
    expect(options.redirectUri.href).toBe(new URL('/callback', window.location.origin).href);
    const [savedRedirect] = mockedSaveRedirect.mock.calls[0] as [URL];
    expect(savedRedirect.href).toBe('https://console.logto.io/accept/invitation-id');
  });

  it('navigates to root when the one-time-token parameters are missing after loading', async () => {
    const signIn = vi.fn();
    mockedUseLogto.mockReturnValue({
      isLoading: false,
      signIn,
    } as unknown as ReturnType<typeof useLogto>);

    renderOneTimeTokenLanding('/one-time-token?one_time_token=token');

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    expect(signIn).not.toHaveBeenCalled();
  });
});
