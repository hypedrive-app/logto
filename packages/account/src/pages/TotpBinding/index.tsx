import Button from '@experience/shared/components/Button';
import DynamicT from '@experience/shared/components/DynamicT';
import VerificationCodeInput, {
  defaultLength,
} from '@experience/shared/components/VerificationCode';
import { AccountCenterControlValue, MfaFactor, type Mfa } from '@logto/schemas';
import type { TFuncKey } from 'i18next';
import qrcode from 'qrcode';
import { useCallback, useContext, useEffect, useState, type FormEvent } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import LoadingContext from '@ac/Providers/LoadingContextProvider/LoadingContext';
import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import { getMfaVerifications, generateTotpSecret, createOrReplaceTotpMfa } from '@ac/apis/mfa';
import ErrorPage from '@ac/components/ErrorPage';
import VerificationMethodList from '@ac/components/VerificationMethodList';
import {
  authenticatorAppSuccessRoute,
  authenticatorAppReplaceSuccessRoute,
} from '@ac/constants/routes';
import useApi from '@ac/hooks/use-api';
import useErrorHandler from '@ac/hooks/use-error-handler';
import SecondaryPageLayout from '@ac/layouts/SecondaryPageLayout';
import { sessionStorage } from '@ac/utils/session-storage';

const isCodeReady = (code: string[]) => code.length === defaultLength && code.every(Boolean);
const isTotpEnabled = (mfa?: Mfa) => mfa?.factors.includes(MfaFactor.TOTP) ?? false;
const errorPage = (messageKey: TFuncKey) => (
  <ErrorPage titleKey="error.something_went_wrong" messageKey={messageKey} />
);
const CopySecretButton = ({
  secret,
  onCopy,
}: {
  readonly secret: string;
  readonly onCopy: () => void;
}) => (
  <div className="w-full">
    <div className="p-4 w-full text-center text-base font-medium rounded-[13px] bg-surface text-ink mb-4 break-all">
      {secret}
    </div>
    <Button
      title="action.copy"
      type="secondary"
      onClick={() => {
        onCopy();
      }}
    />
  </div>
);

type Props = {
  readonly isReplace?: boolean;
};

const TotpBinding = ({ isReplace }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading } = useContext(LoadingContext);
  const {
    accountCenterSettings,
    experienceSettings,
    verificationId,
    setVerificationId,
    setToast,
    userInfo,
  } = useContext(PageContext);
  const getMfaRequest = useApi(getMfaVerifications, { silent: true });
  const generateSecretRequest = useApi(generateTotpSecret, { silent: true });
  const createOrReplaceTotpRequest = useApi(createOrReplaceTotpMfa);
  const handleError = useErrorHandler();

  const [secret, setSecret] = useState<string>();
  const [secretQrCode, setSecretQrCode] = useState<string>();
  const [isQrCodeFormat, setIsQrCodeFormat] = useState(!isMobile);
  const [codeInput, setCodeInput] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [hasTotpAlready, setHasTotpAlready] = useState<boolean>();
  useEffect(() => {
    const checkExistingMfa = async () => {
      const [error, result] = await getMfaRequest();
      if (error) {
        setHasTotpAlready(false);
        return;
      }
      setHasTotpAlready(result?.some((mfa) => mfa.type === MfaFactor.TOTP) ?? false);
    };
    void checkExistingMfa();
  }, [getMfaRequest]);
  useEffect(() => {
    if (
      !verificationId ||
      Boolean(secret) ||
      hasTotpAlready === undefined ||
      (hasTotpAlready && !isReplace)
    ) {
      return;
    }
    const generateSecret = async () => {
      const [error, result] = await generateSecretRequest();
      if (error) {
        await handleError(error);
        return;
      }

      if (result) {
        setSecret(result.secret);
        const displayName =
          userInfo?.username ?? userInfo?.primaryEmail ?? userInfo?.primaryPhone ?? 'User';
        const service = window.location.hostname;
        const keyUri = `otpauth://totp/${encodeURIComponent(service)}:${encodeURIComponent(displayName)}?secret=${result.secret}&issuer=${encodeURIComponent(service)}`;
        try {
          setSecretQrCode(await qrcode.toDataURL(keyUri));
        } catch (error) {
          console.error('Failed to generate TOTP QR code:', error);
        }
      }
    };
    void generateSecret();
  }, [
    generateSecretRequest,
    handleError,
    hasTotpAlready,
    isReplace,
    secret,
    userInfo,
    verificationId,
  ]);
  useEffect(() => {
    if (verificationId && hasTotpAlready === false) {
      sessionStorage.clearRouteRestore();
    }
  }, [hasTotpAlready, verificationId]);
  const copySecret = useCallback(async () => {
    if (!secret) {
      return;
    }
    await navigator.clipboard.writeText(secret);
    setToast(t('mfa.secret_key_copied'));
  }, [secret, setToast, t]);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!verificationId || !secret || loading || !isCodeReady(codeInput)) {
        return;
      }
      setErrorMessage(undefined);
      const codeString = codeInput.join('');
      const [error] = await createOrReplaceTotpRequest(verificationId, {
        secret,
        code: codeString,
      });

      if (error) {
        await handleError(error, {
          'verification_record.permission_denied': async () => {
            setVerificationId(undefined);
            setToast(t('account_center.verification.verification_required'));
          },
          'user.totp_already_in_use': async (requestError) => {
            setToast(requestError.message);
          },
          'session.mfa.invalid_totp_code': async () => {
            setErrorMessage(t('error.invalid_passcode'));
            setCodeInput([]);
          },
        });
        return;
      }

      // Clear code input to prevent duplicate submission
      setCodeInput([]);

      navigate(isReplace ? authenticatorAppReplaceSuccessRoute : authenticatorAppSuccessRoute, {
        replace: true,
      });
    },
    [
      codeInput,
      createOrReplaceTotpRequest,
      handleError,
      isReplace,
      loading,
      navigate,
      secret,
      setToast,
      setVerificationId,
      t,
      verificationId,
    ]
  );

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (!isCodeReady(codeInput)) {
      return;
    }
    void handleSubmit();
  }, [codeInput, handleSubmit]);
  if (
    !accountCenterSettings?.enabled ||
    accountCenterSettings.fields.mfa !== AccountCenterControlValue.Edit
  ) {
    return errorPage('error.feature_not_enabled');
  }
  if (!isTotpEnabled(experienceSettings?.mfa)) {
    return errorPage('account_center.mfa.totp_not_enabled');
  }
  if (hasTotpAlready && !isReplace) {
    return errorPage('account_center.mfa.totp_already_added');
  }
  if (!verificationId) {
    return <VerificationMethodList />;
  }

  return (
    <SecondaryPageLayout
      title={isReplace ? 'mfa.replace_authenticator_app' : 'mfa.add_authenticator_app'}
      description=""
    >
      <div className="flex flex-col gap-4 w-full max-w-[400px]">
        {/* Step 1: QR Code or Secret Key */}
        <div className="flex flex-col gap-2">
          <div className="text-base font-medium text-ink">
            <DynamicT
              forKey="mfa.step"
              interpolation={{
                step: 1,
                content: isQrCodeFormat ? t('mfa.scan_qr_code') : t('mfa.copy_and_paste_key'),
              }}
            />
          </div>
          <div className="text-sm text-muted">
            <DynamicT
              forKey={
                isQrCodeFormat
                  ? 'mfa.scan_qr_code_description'
                  : 'mfa.copy_and_paste_key_description'
              }
            />
          </div>
          <div className="flex flex-col items-center gap-4 mt-2">
            {isQrCodeFormat &&
              (secretQrCode ? (
                <div className="border border-line rounded-[13px] [overflow:hidden] h-[136px] w-[136px]">
                  <img className="w-full h-full block object-center" src={secretQrCode} alt="QR code" />
                </div>
              ) : secret ? (
                <CopySecretButton secret={secret} onCopy={copySecret} />
              ) : (
                <div className="border border-line rounded-[13px] [overflow:hidden] h-[136px] w-[136px] bg-surface" />
              ))}
            {!isQrCodeFormat && secret && <CopySecretButton secret={secret} onCopy={copySecret} />}
            <button
              type="button"
              className="bg-transparent border-none p-0 text-sm font-medium text-primary cursor-pointer active:text-ink desktop:hover:text-ink"
              onClick={() => {
                setIsQrCodeFormat(!isQrCodeFormat);
              }}
            >
              <DynamicT
                forKey={isQrCodeFormat ? 'mfa.qr_code_not_available' : 'mfa.want_to_scan_qr_code'}
              />
            </button>
          </div>
        </div>

        {/* Step 2: Verification Code */}
        <div className="h-px bg-line my-2" />
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <div className="text-base font-medium text-ink">
            <DynamicT
              forKey="mfa.step"
              interpolation={{ step: 2, content: t('mfa.enter_one_time_code') }}
            />
          </div>
          <div className="text-sm text-muted">
            <DynamicT forKey="mfa.enter_one_time_code_link_description" />
          </div>
          <VerificationCodeInput
            name="totpCode"
            className="w-full mt-2"
            value={codeInput}
            error={errorMessage}
            onChange={setCodeInput}
          />
          <Button
            title="action.continue"
            type="primary"
            htmlType="submit"
            className="mt-2 self-start"
            isLoading={loading}
          />
        </form>
      </div>
    </SecondaryPageLayout>
  );
};

export default TotpBinding;
