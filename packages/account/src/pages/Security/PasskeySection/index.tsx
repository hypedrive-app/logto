import { MfaFactor } from '@logto/schemas';
import classNames from 'classnames';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import WebAuthnIcon from '@ac/assets/icons/factor-webauthn.svg?react';
import ToggleSwitch from '@ac/components/ToggleSwitch';
import { passkeyAddRoute, passkeyManageRoute, verifiedActionRoute } from '@ac/constants/routes';
import { getPendingReturn, setPendingReturn } from '@ac/utils/account-center-route';
import {
  getPasskeyFieldControl,
  hasVisiblePasskeySection,
  isEditableField,
} from '@ac/utils/security-page';
import { sessionStorage } from '@ac/utils/session-storage';

import { getLogtoConfig, updateLogtoConfig } from '../../../apis/logto-config';
import useApi from '../../../hooks/use-api';
import useErrorHandler from '../../../hooks/use-error-handler';
import { useMfaVerifications } from '../MfaVerificationsProvider';
import SecurityRow, { type SecurityRowData } from '../components/SecurityRow';
import SecuritySection from '../components/SecuritySection';
import { SecurityRowSkeleton, SecuritySkeleton } from '../components/SecuritySkeleton';

// Shimmer block styling, matching the shared `SecuritySkeleton` (kept inline since that
// component does not export its block primitive). Used only for the toggle-row skeleton.
const skeletonBlock =
  'relative overflow-hidden rounded-[13px] bg-surface-2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] bg-[length:200%_100%] bg-no-repeat animate-[shimmer_2s_infinite]';

const PasskeySection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accountCenterSettings, experienceSettings, verificationId, setVerificationId, setToast } =
    useContext(PageContext);
  const { mfaVerifications, isLoading, hasLoaded } = useMfaVerifications();
  const handleError = useErrorHandler();

  const [passkeySignInSkipped, setPasskeySignInSkipped] = useState<boolean>();
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const getLogtoConfigRequest = useApi(getLogtoConfig, { silent: true });
  const updateLogtoConfigApi = useApi(updateLogtoConfig);

  const passkeyControl = getPasskeyFieldControl(
    accountCenterSettings?.fields.passkey,
    accountCenterSettings?.fields.mfa
  );
  const isEditable = isEditableField(passkeyControl);
  const isSectionVisible = hasVisiblePasskeySection(passkeyControl, experienceSettings);
  const showToggle = isSectionVisible && isEditable;
  const isPromptEnabled = passkeySignInSkipped === false;
  const isSectionLoading =
    (isSectionVisible && (!hasLoaded || isLoading)) ||
    (showToggle && (!hasLoadedConfig || isLoadingConfig));

  const fetchLogtoConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    const [error, result] = await getLogtoConfigRequest();
    if (!error && result) {
      setPasskeySignInSkipped(result.passkeySignIn.skipped);
    }
    setHasLoadedConfig(true);
    setIsLoadingConfig(false);
  }, [getLogtoConfigRequest]);

  useEffect(() => {
    if (showToggle) {
      void fetchLogtoConfig();
    }
  }, [showToggle, fetchLogtoConfig]);

  const navigateTo = useCallback(
    (route: string) => {
      setPendingReturn(getPendingReturn() ?? window.location.href);
      void navigate(route);
    },
    [navigate]
  );

  const updatePasskeySignInSkipped = useCallback(
    async (verifiedId: string, skipped: boolean) => {
      const [error] = await updateLogtoConfigApi(verifiedId, { passkeySignIn: { skipped } });

      if (error) {
        await handleError(error, {
          'verification_record.permission_denied': async () => {
            setVerificationId(undefined);
            setToast(t('account_center.verification.verification_required'));
          },
        });
        return;
      }

      setPasskeySignInSkipped(skipped);
    },
    [handleError, setToast, setVerificationId, t, updateLogtoConfigApi]
  );

  const handleToggleChange = useCallback(
    async (checked: boolean) => {
      const skipped = !checked;

      if (verificationId) {
        await updatePasskeySignInSkipped(verificationId, skipped);
        return;
      }

      sessionStorage.setPendingVerifiedAction(
        checked ? 'enable-passkey-prompt' : 'disable-passkey-prompt'
      );
      navigateTo(verifiedActionRoute);
    },
    [navigateTo, updatePasskeySignInSkipped, verificationId]
  );

  useEffect(() => {
    if (!verificationId) {
      return;
    }

    const pendingAction = sessionStorage.getPendingVerifiedAction();

    if (pendingAction !== 'enable-passkey-prompt' && pendingAction !== 'disable-passkey-prompt') {
      return;
    }

    sessionStorage.clearPendingVerifiedAction();
    void updatePasskeySignInSkipped(verificationId, pendingAction === 'disable-passkey-prompt');
  }, [updatePasskeySignInSkipped, verificationId]);

  if (!isSectionVisible) {
    return null;
  }

  const passkeyCount =
    mfaVerifications?.filter((verification) => verification.type === MfaFactor.WebAuthn).length ??
    0;
  const isConfigured = passkeyCount > 0;

  const passkeyRow: SecurityRowData = {
    key: 'passkey',
    icon: WebAuthnIcon,
    label: t('account_center.security.passkeys'),
    value: isConfigured
      ? t('account_center.security.passkeys_count', { count: passkeyCount })
      : undefined,
    isConfigured,
    action: isEditable
      ? {
          label: isConfigured
            ? t('account_center.security.manage')
            : t('account_center.security.add'),
          handler: () => {
            navigateTo(isConfigured ? passkeyManageRoute : passkeyAddRoute);
          },
        }
      : undefined,
  };

  if (isSectionLoading) {
    return (
      <SecuritySection title={t('account_center.security.passkeys')}>
        <SecuritySkeleton ariaLabel={t('account_center.security.passkeys')}>
          {showToggle && (
            <>
              <div className="flex items-center gap-6 px-6 py-5 mobile:gap-3 mobile:p-4">
                <div className="flex-1 flex flex-col gap-1 min-w-0 mobile:gap-1.5">
                  <div className={classNames(skeletonBlock, 'w-[200px] max-w-[60%] h-4')} />
                  <div className={classNames(skeletonBlock, 'w-[360px] max-w-full h-3.5')} />
                </div>
                <div className={classNames(skeletonBlock, 'w-11 h-6 shrink-0 rounded-xl')} />
              </div>
              <div className="h-px bg-line" />
            </>
          )}
          <SecurityRowSkeleton hasAction={isEditable} />
        </SecuritySkeleton>
      </SecuritySection>
    );
  }

  return (
    <SecuritySection title={t('account_center.security.passkeys')}>
      {showToggle && (
        <>
          <div className="flex items-center gap-6 px-6 py-5 mobile:gap-3 mobile:p-4">
            <div className="flex-1 flex flex-col gap-1 min-w-0 mobile:gap-1.5">
              <div className="text-sm font-medium text-ink mobile:[overflow-wrap:anywhere] mobile:break-words">
                {t('account_center.security.passkey_sign_in_prompt')}
              </div>
              <div className="text-sm text-muted mobile:[overflow-wrap:anywhere] mobile:break-words">
                {t('account_center.security.passkey_sign_in_prompt_description')}
              </div>
            </div>
            <ToggleSwitch
              isChecked={isPromptEnabled}
              ariaLabel={t('account_center.security.passkey_sign_in_prompt')}
              onChange={(checked) => {
                void handleToggleChange(checked);
              }}
            />
          </div>
          <div className="h-px bg-line" />
        </>
      )}
      <SecurityRow row={passkeyRow} />
    </SecuritySection>
  );
};

export default PasskeySection;
