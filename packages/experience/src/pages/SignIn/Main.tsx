import {
  type SignIn,
  type ExperienceSocialConnector,
  AgreeToTermsPolicy,
  SignInIdentifier,
} from '@logto/schemas';
import { useMemo } from 'react';

import IdentifierSignInForm from '@/components/IdentifierSignInForm';
import PasswordSignInForm from '@/components/PasswordSignInForm';
import SocialSignInList from '@/containers/SocialSignInList';
import TermsAndPrivacyCheckbox from '@/containers/TermsAndPrivacyCheckbox';
import usePlatform from '@/hooks/use-platform';
import useTerms from '@/hooks/use-terms';

import useIdentifierSignInMethods from '../IdentifierSignIn/use-identifier-sign-in-methods';

type Props = {
  readonly signInMethods: SignIn['methods'];
  readonly socialConnectors: ExperienceSocialConnector[];
};

const Main = ({ signInMethods, socialConnectors }: Props) => {
  const { agreeToTermsPolicy } = useTerms();
  const { isPasswordOnly } = useIdentifierSignInMethods();
  const { isMobile } = usePlatform();
  // Autofocus the identifier field on desktop so users can type immediately, but not on
  // mobile where it would force the on-screen keyboard open over the layout.
  const shouldAutoFocus = !isMobile;

  // Phone is surfaced as a dedicated "Continue with phone" button (rendered in
  // SignInFooters) rather than folded into the combined smart field — so the primary
  // field stays an unambiguous email/username entry and the phone flow gets a focused
  // screen with the country-code selector always visible. Drop phone from the inline
  // form here, but only when at least one non-phone method remains (else keep it so the
  // field isn't empty). The phone button stays available regardless.
  const inlineSignInMethods = useMemo(() => {
    const nonPhone = signInMethods.filter(
      ({ identifier }) => identifier !== SignInIdentifier.Phone
    );
    return nonPhone.length > 0 ? nonPhone : signInMethods;
  }, [signInMethods]);

  if (signInMethods.length === 0 && socialConnectors.length > 0) {
    return (
      <>
        <SocialSignInList className="mb-4" socialConnectors={socialConnectors} />
        {
          /**
           * Display agreement checkbox when only social sign-in methods are available
           * and the user needs to agree to terms manually.
           */
          agreeToTermsPolicy === AgreeToTermsPolicy.Manual && (
            <TermsAndPrivacyCheckbox className="mb-4" />
          )
        }
      </>
    );
  }

  if (isPasswordOnly) {
    return (
      <PasswordSignInForm
        autoFocus={shouldAutoFocus}
        className="mb-4"
        signInMethods={inlineSignInMethods.map(({ identifier }) => identifier)}
      />
    );
  }

  if (inlineSignInMethods.length > 0) {
    return (
      <IdentifierSignInForm
        autoFocus={shouldAutoFocus}
        className="mb-4"
        signInMethods={inlineSignInMethods}
      />
    );
  }

  return null;
};

export default Main;
