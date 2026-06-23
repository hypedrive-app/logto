import { type SignInIdentifier } from '@logto/schemas';
import { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import TextLink from '@/components/TextLink';
import Button from '@/shared/components/Button';
import VerificationCodeInput from '@/shared/components/VerificationCode';

import useMfaCodeVerification from './use-mfa-code-verification';
import useResendMfaVerificationCode from './use-resend-mfa-verification-code';

const codeLength = 6;

const isCodeReady = (code: string[]) => {
  return code.length === codeLength && code.every(Boolean);
};

type Props = {
  readonly identifierType: SignInIdentifier.Email | SignInIdentifier.Phone;
  readonly verificationId: string;
};

const MfaCodeVerification = ({ identifierType, verificationId }: Props) => {
  const { t } = useTranslation();
  const [codeInput, setCodeInput] = useState<string[]>([]);
  const [inputErrorMessage, setInputErrorMessage] = useState<string>();
  const [currentVerificationId, setCurrentVerificationId] = useState(verificationId);

  useEffect(() => {
    setCurrentVerificationId(verificationId);
  }, [verificationId]);

  const errorCallback = useCallback(() => {
    setCodeInput([]);
    setInputErrorMessage(undefined);
  }, []);

  const { errorMessage: submitErrorMessage, onSubmit } = useMfaCodeVerification(
    identifierType,
    currentVerificationId,
    errorCallback
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorMessage = inputErrorMessage ?? submitErrorMessage;

  const { seconds, isRunning, onResendVerificationCode } =
    useResendMfaVerificationCode(identifierType);

  const handleSubmit = useCallback(
    async (code: string[]) => {
      if (isSubmitting) {
        return;
      }

      setInputErrorMessage(undefined);
      setIsSubmitting(true);

      await onSubmit(code.join(''));
      setIsSubmitting(false);
    },
    [onSubmit, isSubmitting]
  );

  return (
    <>
      <VerificationCodeInput
        name="mfaCode"
        value={codeInput}
        className="mt-4"
        error={errorMessage}
        onChange={(code) => {
          setCodeInput(code);
          if (isCodeReady(code)) {
            void handleSubmit(code);
          }
        }}
      />
      <div className="mt-3 text-sm text-muted">
        {isRunning ? (
          <Trans components={{ span: <span key="counter" /> }}>
            {t('description.resend_after_seconds', { seconds })}
          </Trans>
        ) : (
          <Trans
            components={{
              a: (
                <TextLink
                  className="cursor-pointer"
                  onClick={async () => {
                    setInputErrorMessage(undefined);
                    setCodeInput([]);
                    const newId = await onResendVerificationCode();
                    if (newId) {
                      setCurrentVerificationId(newId);
                    }
                  }}
                />
              ),
            }}
          >
            {t('description.resend_passcode')}
          </Trans>
        )}
      </div>
      <Button
        title="action.continue"
        type="primary"
        className="mt-6"
        isLoading={isSubmitting}
        onClick={() => {
          if (!isCodeReady(codeInput)) {
            setInputErrorMessage(t('error.invalid_passcode'));
            return;
          }

          void handleSubmit(codeInput);
        }}
      />
    </>
  );
};

export default MfaCodeVerification;
