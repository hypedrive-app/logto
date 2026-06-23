import { AccountCenterControlValue } from '@logto/schemas';
import { formatToInternationalPhoneNumber } from '@logto/shared/universal';
import classNames from 'classnames';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import { deletePrimaryEmail, deletePrimaryPhone } from '@ac/apis/account';
import EmailIcon from '@ac/assets/icons/email.svg?react';
import PhoneIcon from '@ac/assets/icons/phone.svg?react';
import ConfirmModal from '@ac/components/ConfirmModal';
import { layoutClassNames } from '@ac/constants/layout';
import { emailRoute, phoneRoute, verifiedActionRoute } from '@ac/constants/routes';
import useApi from '@ac/hooks/use-api';
import useErrorHandler from '@ac/hooks/use-error-handler';
import { getPendingReturn, setPendingReturn } from '@ac/utils/account-center-route';
import { sessionStorage } from '@ac/utils/session-storage';

type RemoveType = 'email' | 'phone';

const rowClass = classNames(
  'items-center not-last:border-b not-last:border-line',
  'desktop:grid desktop:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] desktop:[grid-auto-flow:dense] desktop:gap-x-6 desktop:px-6 desktop:py-5 desktop:min-h-[64px]',
  'mobile:flex mobile:flex-col mobile:items-stretch mobile:gap-1 mobile:p-4'
);
const topLineClass =
  'desktop:contents mobile:flex mobile:items-center mobile:justify-between mobile:gap-3 mobile:w-full';
const actionsClass =
  'flex items-center gap-6 shrink-0 desktop:col-start-3 mobile:flex-wrap mobile:justify-end mobile:gap-4';
const changeButtonClass =
  'text-sm font-medium text-primary cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start';
const removeButtonClass =
  'text-sm font-medium text-danger cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start';
const titleClass =
  'min-w-0 text-sm font-medium text-ink desktop:col-start-1 desktop:row-start-1 desktop:ps-[calc(20px+1rem)] mobile:ps-0 mobile:w-full mobile:[overflow-wrap:anywhere] mobile:break-words';

const EmailPhoneSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    userInfo,
    accountCenterSettings,
    verificationId,
    setVerificationId,
    refreshUserInfo,
    setToast,
  } = useContext(PageContext);
  const handleError = useErrorHandler();
  const deletePrimaryEmailApi = useApi(deletePrimaryEmail);
  const deletePrimaryPhoneApi = useApi(deletePrimaryPhone);

  const [pendingRemoveType, setPendingRemoveType] = useState<RemoveType>();

  const emailControl = accountCenterSettings?.fields.email;
  const phoneControl = accountCenterSettings?.fields.phone;

  const showEmail = emailControl && emailControl !== AccountCenterControlValue.Off;
  const showPhone = phoneControl && phoneControl !== AccountCenterControlValue.Off;
  const emailValue = userInfo?.primaryEmail;
  const phoneValue = userInfo?.primaryPhone
    ? formatToInternationalPhoneNumber(userInfo.primaryPhone)
    : undefined;

  const navigateTo = useCallback(
    (route: string) => {
      setPendingReturn(getPendingReturn() ?? window.location.href);
      navigate(route);
    },
    [navigate]
  );

  const removeIdentifier = useCallback(
    async (removeType: RemoveType, verifiedId: string) => {
      const deleteApi = removeType === 'email' ? deletePrimaryEmailApi : deletePrimaryPhoneApi;
      const [error] = await deleteApi(verifiedId);

      if (error) {
        await handleError(error, {
          'verification_record.permission_denied': async () => {
            setVerificationId(undefined);
            setToast(t('account_center.verification.verification_required'));
          },
        });
        return;
      }

      await refreshUserInfo();
      setToast(
        t(
          removeType === 'email'
            ? 'account_center.security.email_removed'
            : 'account_center.security.phone_removed'
        )
      );
    },
    [
      deletePrimaryEmailApi,
      deletePrimaryPhoneApi,
      handleError,
      refreshUserInfo,
      setToast,
      setVerificationId,
      t,
    ]
  );

  const handleRemoveConfirm = useCallback(async () => {
    if (!pendingRemoveType) {
      return;
    }

    setPendingRemoveType(undefined);

    if (verificationId) {
      await removeIdentifier(pendingRemoveType, verificationId);
      return;
    }

    sessionStorage.setPendingVerifiedAction(
      pendingRemoveType === 'email' ? 'remove-email' : 'remove-phone'
    );
    navigateTo(verifiedActionRoute);
  }, [pendingRemoveType, verificationId, navigateTo, removeIdentifier]);

  useEffect(() => {
    if (!verificationId) {
      return;
    }

    const pendingAction = sessionStorage.getPendingVerifiedAction();
    const pendingActionRemoveType =
      pendingAction === 'remove-email'
        ? 'email'
        : pendingAction === 'remove-phone'
          ? 'phone'
          : undefined;

    if (!pendingActionRemoveType) {
      return;
    }

    sessionStorage.clearPendingVerifiedAction();
    void removeIdentifier(pendingActionRemoveType, verificationId);
  }, [removeIdentifier, verificationId]);

  if (!showEmail && !showPhone) {
    return null;
  }

  return (
    <>
      <div className={classNames('flex flex-col gap-1.5', layoutClassNames.section)}>
        <div
          className={classNames(
            'ps-1 text-sm font-medium text-ink mobile:ps-0',
            layoutClassNames.sectionTitle
          )}
        >
          {t('account_center.security.email_phone')}
        </div>
        <div
          className={classNames('bg-elevated rounded-[16px] [overflow:clip]', layoutClassNames.card)}
        >
          {showEmail && (
            <div className={classNames(rowClass, layoutClassNames.row)}>
              <div className={topLineClass}>
                <div className="flex items-center justify-self-start shrink-0 desktop:col-start-1 desktop:row-start-1">
                  <EmailIcon className="w-5 h-5 text-ink" />
                </div>
                {emailControl === AccountCenterControlValue.Edit && (
                  <div className={actionsClass}>
                    <button
                      type="button"
                      className={changeButtonClass}
                      onClick={() => {
                        navigateTo(emailRoute);
                      }}
                    >
                      {emailValue
                        ? t('account_center.security.change')
                        : t('account_center.security.add')}
                    </button>
                    {emailValue && (
                      <button
                        type="button"
                        className={removeButtonClass}
                        onClick={() => {
                          setPendingRemoveType('email');
                        }}
                      >
                        {t('account_center.security.remove')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className={titleClass}>{t('account_center.security.email')}</div>
              <div
                className={classNames(
                  'min-w-0 text-sm desktop:col-start-2 mobile:w-full mobile:[overflow-wrap:anywhere] mobile:break-words',
                  emailValue ? 'text-ink' : 'text-muted'
                )}
              >
                {emailValue ?? t('account_center.security.not_set')}
              </div>
            </div>
          )}
          {showPhone && (
            <div className={classNames(rowClass, layoutClassNames.row)}>
              <div className={topLineClass}>
                <div className="flex items-center justify-self-start shrink-0 desktop:col-start-1 desktop:row-start-1">
                  <PhoneIcon className="w-5 h-5 text-ink" />
                </div>
                {phoneControl === AccountCenterControlValue.Edit && (
                  <div className={actionsClass}>
                    <button
                      type="button"
                      className={changeButtonClass}
                      onClick={() => {
                        navigateTo(phoneRoute);
                      }}
                    >
                      {phoneValue
                        ? t('account_center.security.change')
                        : t('account_center.security.add')}
                    </button>
                    {phoneValue && (
                      <button
                        type="button"
                        className={removeButtonClass}
                        onClick={() => {
                          setPendingRemoveType('phone');
                        }}
                      >
                        {t('account_center.security.remove')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className={titleClass}>{t('account_center.security.phone')}</div>
              <div
                className={classNames(
                  'min-w-0 text-sm desktop:col-start-2 mobile:w-full mobile:[overflow-wrap:anywhere] mobile:break-words',
                  phoneValue ? 'text-ink' : 'text-muted'
                )}
              >
                {phoneValue ?? t('account_center.security.not_set')}
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={pendingRemoveType !== undefined}
        title={
          pendingRemoveType === 'email'
            ? 'account_center.security.remove_email_confirmation_title'
            : 'account_center.security.remove_phone_confirmation_title'
        }
        confirmText="account_center.security.remove"
        confirmButtonType="danger"
        cancelText="action.cancel"
        onConfirm={() => {
          void handleRemoveConfirm();
        }}
        onCancel={() => {
          setPendingRemoveType(undefined);
        }}
      >
        {t(
          pendingRemoveType === 'email'
            ? 'account_center.security.remove_email_confirmation_description'
            : 'account_center.security.remove_phone_confirmation_description'
        )}
      </ConfirmModal>
    </>
  );
};

export default EmailPhoneSection;
