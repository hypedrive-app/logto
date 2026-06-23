import { type SignIn, type ExperienceSocialConnector, AgreeToTermsPolicy } from '@logto/schemas';

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
        signInMethods={signInMethods.map(({ identifier }) => identifier)}
      />
    );
  }

  if (signInMethods.length > 0) {
    return (
      <IdentifierSignInForm
        autoFocus={shouldAutoFocus}
        className="mb-4"
        signInMethods={signInMethods}
      />
    );
  }

  return null;
};

export default Main;
