import { AccountCenterControlValue } from '@logto/schemas';
import classNames from 'classnames';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import { deleteUsername } from '@ac/apis/account';
import ConfirmModal from '@ac/components/ConfirmModal';
import { layoutClassNames } from '@ac/constants/layout';
import { usernameRoute, verifiedActionRoute } from '@ac/constants/routes';
import useApi from '@ac/hooks/use-api';
import useErrorHandler from '@ac/hooks/use-error-handler';
import { getPendingReturn, setPendingReturn } from '@ac/utils/account-center-route';
import { sessionStorage } from '@ac/utils/session-storage';

const UsernameSection = () => {
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
  const deleteUsernameApi = useApi(deleteUsername);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const usernameControl = accountCenterSettings?.fields.username;
  const usernameValue = userInfo?.username;

  const navigateTo = useCallback(
    (route: string) => {
      setPendingReturn(getPendingReturn() ?? window.location.href);
      void navigate(route);
    },
    [navigate]
  );

  const removeUsername = useCallback(
    async (verifiedId: string) => {
      const [error] = await deleteUsernameApi(verifiedId);

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
      setToast(t('account_center.security.username_removed'));
    },
    [deleteUsernameApi, handleError, refreshUserInfo, setToast, setVerificationId, t]
  );

  const handleRemoveConfirm = useCallback(async () => {
    setIsRemoveModalOpen(false);

    if (verificationId) {
      await removeUsername(verificationId);
      return;
    }

    sessionStorage.setPendingVerifiedAction('remove-username');
    navigateTo(verifiedActionRoute);
  }, [navigateTo, removeUsername, verificationId]);

  useEffect(() => {
    if (!verificationId || sessionStorage.getPendingVerifiedAction() !== 'remove-username') {
      return;
    }

    sessionStorage.clearPendingVerifiedAction();
    void removeUsername(verificationId);
  }, [removeUsername, verificationId]);

  if (!usernameControl || usernameControl === AccountCenterControlValue.Off) {
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
          {t('input.username')}
        </div>
        <div
          className={classNames(
            'bg-elevated rounded-[16px] [overflow:clip]',
            layoutClassNames.card
          )}
        >
          <div
            className={classNames(
              'items-center',
              'desktop:grid desktop:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] desktop:[grid-auto-flow:dense] desktop:gap-x-6 desktop:px-6 desktop:py-5 desktop:min-h-16',
              'mobile:flex mobile:flex-col mobile:items-stretch mobile:gap-1 mobile:p-4',
              layoutClassNames.row
            )}
          >
            <div className="desktop:contents mobile:flex mobile:items-center mobile:justify-between mobile:gap-3 mobile:w-full">
              <div className="min-w-0 text-sm font-medium text-ink desktop:col-start-1 mobile:w-full">
                {t('input.username')}
              </div>
              {usernameControl === AccountCenterControlValue.Edit && (
                <div className="flex items-center gap-6 shrink-0 desktop:col-start-3 mobile:flex-wrap mobile:justify-end mobile:gap-4">
                  <button
                    type="button"
                    className="text-sm font-medium text-primary cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start"
                    onClick={() => {
                      navigateTo(usernameRoute);
                    }}
                  >
                    {usernameValue
                      ? t('account_center.security.change')
                      : t('account_center.security.add')}
                  </button>
                  {usernameValue && (
                    <button
                      type="button"
                      className="text-sm font-medium text-danger cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start"
                      onClick={() => {
                        setIsRemoveModalOpen(true);
                      }}
                    >
                      {t('account_center.security.remove')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div
              className={classNames(
                'min-w-0 text-sm desktop:col-start-2 mobile:w-full mobile:[overflow-wrap:anywhere] mobile:break-words',
                usernameValue ? 'text-ink' : 'text-muted'
              )}
            >
              {usernameValue ?? t('account_center.security.not_set')}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isRemoveModalOpen}
        title="account_center.security.remove_username_confirmation_title"
        confirmText="account_center.security.remove"
        confirmButtonType="danger"
        cancelText="action.cancel"
        onConfirm={() => {
          void handleRemoveConfirm();
        }}
        onCancel={() => {
          setIsRemoveModalOpen(false);
        }}
      >
        {t('account_center.security.remove_username_confirmation_description')}
      </ConfirmModal>
    </>
  );
};

export default UsernameSection;
