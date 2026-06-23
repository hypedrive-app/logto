import { AgreeToTermsPolicy, experience, ExtraParamsKey, SignInMode } from '@logto/schemas';
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router-dom';

import useStepUpAcr from '@/hooks/use-step-up-acr';

import LandingPageLayout from '@/Layout/LandingPageLayout';
import SingleSignOnFormModeContextProvider from '@/Providers/SingleSignOnFormModeContextProvider';
import SingleSignOnFormModeContext from '@/Providers/SingleSignOnFormModeContextProvider/SingleSignOnFormModeContext';
import WebAuthnContextProvider from '@/Providers/WebAuthnContextProvider';
import PasskeySignInButton from '@/components/Button/PasskeySignInButton';
import Divider from '@/components/Divider';
import GoogleOneTap from '@/components/GoogleOneTap';
import TextLink from '@/components/TextLink';
import SocialSignInList from '@/containers/SocialSignInList';
import TermsAndPrivacyCheckbox from '@/containers/TermsAndPrivacyCheckbox';
import TermsAndPrivacyLinks from '@/containers/TermsAndPrivacyLinks';
import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import { useSieMethods } from '@/hooks/use-sie';
import useTerms from '@/hooks/use-terms';

import ErrorPage from '../ErrorPage';

import Main from './Main';

const SignInFooters = () => {
  const { t } = useTranslation();
  const { termsValidation, agreeToTermsPolicy } = useTerms();
  const navigate = useNavigateWithPreservedSearchParams();

  const {
    signInMethods,
    signUpMethods,
    socialConnectors,
    signInMode,
    singleSignOnEnabled,
    passkeySignIn,
  } = useSieMethods();

  const { showSingleSignOnForm } = useContext(SingleSignOnFormModeContext);

  const handleSsoNavigation = useCallback(async () => {
    /**
     * Check if the user has agreed to the terms and privacy policy before navigating to the SSO page
     * when the policy is set to `Manual`
     */
    if (agreeToTermsPolicy === AgreeToTermsPolicy.Manual && !(await termsValidation())) {
      return;
    }
    navigate('/single-sign-on/email');
  }, [agreeToTermsPolicy, navigate, termsValidation]);

  /* Hide footers when showing Single Sign On form */
  if (showSingleSignOnForm) {
    return null;
  }

  return (
    <>
      {
        // Single Sign On footer
        singleSignOnEnabled && (
          <>
            <div className="text-center text-xs text-muted mb-4">
              {t('description.use')}{' '}
              <TextLink text="action.single_sign_on" onClick={handleSsoNavigation} />
            </div>
            {
              /**
               * If only SSO sign-in methods are available, display the agreement checkbox when the agreement policy is `Manual`.
               */
              signInMethods.length === 0 &&
                socialConnectors.length === 0 &&
                agreeToTermsPolicy === AgreeToTermsPolicy.Manual && (
                  <TermsAndPrivacyCheckbox className="justify-center" />
                )
            }
          </>
        )
      }
      {
        // Create Account footer
        signInMode === SignInMode.SignInAndRegister && signUpMethods.length > 0 && (
          <div className="text-center text-base text-ink mb-5">
            {t('description.no_account')}{' '}
            <TextLink replace to="/register" text="action.create_account" />
          </div>
        )
      }
      {
        // Social sign-in methods
        signInMethods.length > 0 && socialConnectors.length > 0 && (
          <>
            <Divider label="description.or" className="mb-4" />
            <SocialSignInList socialConnectors={socialConnectors} className="mb-4" />
          </>
        )
      }
      {passkeySignIn?.enabled && passkeySignIn.showPasskeyButton && <PasskeySignInButton />}
    </>
  );
};

const SignIn = () => {
  const { signInMethods, socialConnectors, signInMode } = useSieMethods();
  const { agreeToTermsPolicy } = useTerms();
  const [params] = useSearchParams();
  const stepUpAcr = useStepUpAcr();

  if (!signInMode) {
    return <ErrorPage />;
  }

  if (signInMode === SignInMode.Register) {
    return <Navigate to="/register" />;
  }

  /**
   * Step-up authentication (RFC 9470): the OIDC server has injected `step_up_acr`
   * into the URL because `acr_values` was requested and the existing session does
   * not yet satisfy it. Redirect to the step-up flow which skips the
   * identifier/password step and shows only MFA verification.
   */
  if (stepUpAcr) {
    return (
      <Navigate
        replace
        to={{ pathname: '/step-up', search: `?${params.toString()}` }}
      />
    );
  }

  if (params.get(ExtraParamsKey.OneTimeToken)) {
    return (
      <Navigate
        replace
        to={{ pathname: `/${experience.routes.oneTimeToken}`, search: `?${params.toString()}` }}
      />
    );
  }

  return (
    <LandingPageLayout title="description.sign_in_to_your_account">
      <GoogleOneTap context="signin" />
      <WebAuthnContextProvider>
        <SingleSignOnFormModeContextProvider>
          <Main signInMethods={signInMethods} socialConnectors={socialConnectors} />
          <SignInFooters />
        </SingleSignOnFormModeContextProvider>
      </WebAuthnContextProvider>
      {
        // Only show terms and privacy links for sign in page if the agree to terms policy is `Automatic` or `ManualRegistrationOnly`
        agreeToTermsPolicy !== AgreeToTermsPolicy.Manual && (
          <TermsAndPrivacyLinks className="mt-4 text-center text-xs text-muted" />
        )
      }
    </LandingPageLayout>
  );
};

export default SignIn;
