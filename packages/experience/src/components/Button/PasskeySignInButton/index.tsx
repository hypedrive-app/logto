import { InteractionEvent } from '@logto/schemas';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import classNames from 'classnames';
import { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedLoader } from 'use-debounced-loader';

import PageContext from '@/Providers/PageContextProvider/PageContext';
import WebAuthnContext from '@/Providers/WebAuthnContextProvider/WebAuthnContext';
import PasskeyIcon from '@/assets/icons/passkey-icon.svg?react';
import usePasskeySignIn from '@/hooks/use-passkey-sign-in';
import useSubmitInteractionErrorHandler from '@/hooks/use-submit-interaction-error-handler';
import RotatingRingIcon from '@/shared/components/Button/RotatingRingIcon';

const buttonBaseClass =
  'relative flex flex-row items-center justify-center h-12 px-4 rounded-[11px] cursor-pointer font-medium text-base overflow-hidden select-none appearance-none [-webkit-tap-highlight-color:transparent] transition-[background-color,border-color,transform,box-shadow] duration-200 ease-in-out active:not-disabled:scale-[0.985] active:not-disabled:duration-[80ms] desktop:text-[15px]';
const buttonDisabledClass = 'opacity-100 [&]:cursor-not-allowed';

const PasskeySignInButton = () => {
  const { t } = useTranslation();
  const { isPreview } = useContext(PageContext);
  const {
    authenticationOptions,
    isLoading: isPreparing,
    isPasskeyFlowProcessing,
    setIsPasskeyFlowProcessing,
    markAuthenticationOptionsConsumed,
    abortConditionalUI,
  } = useContext(WebAuthnContext);
  const { handleVerifyPasskey } = usePasskeySignIn();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoadingActive = useDebouncedLoader(isSubmitting, 300);
  const isDisabled = isPreparing || !authenticationOptions || isPasskeyFlowProcessing;

  const preSignInErrorHandler = useSubmitInteractionErrorHandler(InteractionEvent.SignIn, {
    replace: true,
  });

  const onPasskeySignIn = useCallback(async () => {
    if (!authenticationOptions) {
      return;
    }
    // Abort any pending conditional UI request before starting manual passkey sign-in
    // to prevent `OperationError: A request is already pending`.
    abortConditionalUI();
    setIsSubmitting(true);
    setIsPasskeyFlowProcessing(true);
    try {
      await handleVerifyPasskey(authenticationOptions, preSignInErrorHandler);
    } finally {
      markAuthenticationOptionsConsumed();
      setIsPasskeyFlowProcessing(false);
      setIsSubmitting(false);
    }
  }, [
    abortConditionalUI,
    authenticationOptions,
    handleVerifyPasskey,
    markAuthenticationOptionsConsumed,
    preSignInErrorHandler,
    setIsPasskeyFlowProcessing,
  ]);

  if (!browserSupportsWebAuthn()) {
    return null;
  }

  return (
    <button
      disabled={isDisabled && !isPreview}
      className={classNames(
        buttonBaseClass,
        'btn-ghost',
        'w-full',
        'grid grid-cols-[auto_1fr] items-center px-4 gap-3',
        isDisabled && !isPreview && buttonDisabledClass
      )}
      type="button"
      onClick={onPasskeySignIn}
    >
      {!isLoadingActive && <PasskeyIcon className="w-6 h-6 text-ink" />}
      {isLoadingActive && (
        <span className="block text-0 leading-none text-[var(--color-brand-loading)]">
          <RotatingRingIcon />
        </span>
      )}
      <span className="text-center leading-5 desktop:leading-4 line-clamp-2">
        {t('action.sign_in_with', { name: t('mfa.webauthn').toLowerCase() })}
      </span>
    </button>
  );
};

export default PasskeySignInButton;
