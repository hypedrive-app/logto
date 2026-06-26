/* eslint-disable max-lines -- pre-existing large page; splitting risks behaviour change. */
import classNames from 'classnames';
import { HTTPError } from 'ky';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import AccountPageHeader from '@ac/components/AccountPageHeader';
import ConfirmModal from '@ac/components/ConfirmModal';
import PageFooter from '@ac/components/PageFooter';
import { layoutClassNames } from '@ac/constants/layout';
import { verifiedActionRoute } from '@ac/constants/routes';
import { getPendingReturn, setPendingReturn } from '@ac/utils/account-center-route';
import { isEditableField } from '@ac/utils/security-page';
import { sessionStorage } from '@ac/utils/session-storage';

import { getSessions, revokeSession, getGrants, revokeGrant } from '../../apis/sessions';
import useApi from '../../hooks/use-api';
import useErrorHandler from '../../hooks/use-error-handler';

import GrantRow from './GrantRow';
import SessionRow from './SessionRow';
import { normalizeGrantRows, type AccountSession, type GrantedAppRow } from './utils';

const Sessions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accountCenterSettings, verificationId, setVerificationId, setToast } =
    useContext(PageContext);
  const [sessions, setSessions] = useState<AccountSession[]>();
  const [grantRows, setGrantRows] = useState<GrantedAppRow[]>();
  const [hasGrantLoadingError, setHasGrantLoadingError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AccountSession>();
  const [revokeGrantTarget, setRevokeGrantTarget] = useState<GrantedAppRow>();
  const [removingAppId, setRemovingAppId] = useState<string>();
  const handleError = useErrorHandler();
  const isFetchingRef = useRef(false);

  const getSessionsApi = useApi(getSessions, { silent: true });
  const revokeSessionApi = useApi(revokeSession);
  const getGrantsApi = useApi(getGrants, { silent: true });
  const revokeGrantApi = useApi(revokeGrant);

  const sessionControl = accountCenterSettings?.fields.session;
  const isEditable = isEditableField(sessionControl);

  const handlePermissionDenied = useCallback(async () => {
    setVerificationId(undefined);
    setToast(t('account_center.verification.verification_required'));
  }, [setVerificationId, setToast, t]);

  const fetchData = useCallback(
    async (verifiedId: string) => {
      if (isFetchingRef.current) {
        return;
      }
      // eslint-disable-next-line @silverhand/fp/no-mutation
      isFetchingRef.current = true;
      setHasGrantLoadingError(false);
      setIsLoading(true);

      const [sessionResponse, grantResponse] = await Promise.all([
        getSessionsApi(verifiedId),
        getGrantsApi(verifiedId),
      ]);

      const [sessionError, sessionResult] = sessionResponse;
      const [grantError, grantResult] = grantResponse;

      if (sessionError) {
        await handleError(sessionError, {
          'verification_record.permission_denied': handlePermissionDenied,
        });
        setIsLoading(false);
        // eslint-disable-next-line @silverhand/fp/no-mutation
        isFetchingRef.current = false;
        return;
      }

      if (sessionResult) {
        setSessions(sessionResult.sessions);
      }

      if (grantError) {
        await handleError(grantError, {
          'verification_record.permission_denied': handlePermissionDenied,
        });
        setHasGrantLoadingError(true);
      } else if (grantResult) {
        setGrantRows(normalizeGrantRows(grantResult.grants));
        setHasGrantLoadingError(false);
      }

      setHasLoaded(true);
      setIsLoading(false);
      // eslint-disable-next-line @silverhand/fp/no-mutation
      isFetchingRef.current = false;
    },
    [getSessionsApi, getGrantsApi, handleError, handlePermissionDenied]
  );

  useEffect(() => {
    if (!verificationId || hasLoaded || isLoading) {
      return;
    }

    const pendingAction = sessionStorage.getPendingVerifiedAction();

    if (pendingAction === 'load-sessions') {
      sessionStorage.clearPendingVerifiedAction();
    }

    void fetchData(verificationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId]);

  const navigateTo = useCallback(
    (route: string) => {
      setPendingReturn(getPendingReturn() ?? window.location.href);
      void navigate(route);
    },
    [navigate]
  );

  const handleManage = useCallback(() => {
    if (verificationId) {
      void fetchData(verificationId);
      return;
    }

    sessionStorage.setPendingVerifiedAction('load-sessions');
    navigateTo(verifiedActionRoute);
  }, [verificationId, fetchData, navigateTo]);

  const handleRevoke = useCallback(
    async (session: AccountSession) => {
      if (!verificationId) {
        return;
      }

      const [error] = await revokeSessionApi(verificationId, session.payload.uid);
      if (error) {
        await handleError(error, {
          'verification_record.permission_denied': async () => {
            setVerificationId(undefined);
            setHasLoaded(false);
            setToast(t('account_center.verification.verification_required'));
          },
        });
        return;
      }

      setSessions((previous) =>
        previous?.filter((item) => item.payload.uid !== session.payload.uid)
      );
    },
    [verificationId, revokeSessionApi, handleError, setVerificationId, setToast, t]
  );

  const handleConfirmRevoke = useCallback(async () => {
    if (!revokeTarget) {
      return;
    }
    setRevokeTarget(undefined);
    await handleRevoke(revokeTarget);
  }, [revokeTarget, handleRevoke]);

  const handleRevokeGrant = useCallback(
    async (app: GrantedAppRow) => {
      if (!verificationId) {
        return;
      }

      setRemovingAppId(app.applicationId);

      const results = await Promise.allSettled(
        app.grantIds.map(async (grantId) => {
          const [error] = await revokeGrantApi(verificationId, grantId);
          if (error) {
            throw error instanceof Error ? error : new Error('revoke_failed');
          }
        })
      );

      const failure = results.find((result) => result.status === 'rejected');
      if (failure) {
        if (failure.reason instanceof HTTPError) {
          await handleError(failure.reason);
        } else {
          setToast(t('account_center.sessions.revoke_grant_failed'));
        }
        setRemovingAppId(undefined);
        return;
      }

      setGrantRows((previous) =>
        previous?.filter((item) => item.applicationId !== app.applicationId)
      );
      setRemovingAppId(undefined);
    },
    [verificationId, revokeGrantApi, handleError, setToast, t]
  );

  const handleConfirmRevokeGrant = useCallback(async () => {
    if (!revokeGrantTarget) {
      return;
    }
    setRevokeGrantTarget(undefined);
    await handleRevokeGrant(revokeGrantTarget);
  }, [revokeGrantTarget, handleRevokeGrant]);

  const currentSession = sessions?.find((item) => item.isCurrent);
  const otherSessions = sessions?.filter((item) => !item.isCurrent) ?? [];

  return (
    <>
      <div className="flex-1 flex flex-col">
        <AccountPageHeader
          titleKey="account_center.sessions.page_title"
          descriptionKey="account_center.sessions.page_description"
        />
        <div
          className={classNames(
            'flex-1 flex flex-col gap-5 mobile:gap-4',
            layoutClassNames.pageContent
          )}
        >
          <div className={classNames('flex flex-col gap-1.5', layoutClassNames.section)}>
            <div
              className={classNames(
                'ps-1 text-sm font-medium text-ink mobile:ps-0',
                layoutClassNames.sectionTitle
              )}
            >
              {t('account_center.sessions.title')}
            </div>
            <div
              className={classNames(
                'bg-elevated rounded-[16px] [overflow:clip]',
                layoutClassNames.card
              )}
            >
              {hasLoaded ? (
                <>
                  {currentSession && (
                    <SessionRow isCurrent session={currentSession} isEditable={false} />
                  )}
                  {otherSessions.map((session) => (
                    <SessionRow
                      key={session.payload.uid}
                      session={session}
                      isEditable={isEditable}
                      onRevoke={() => {
                        setRevokeTarget(session);
                      }}
                    />
                  ))}
                  {otherSessions.length === 0 && (
                    <div className="px-6 py-5 text-sm text-muted text-center">
                      {t('account_center.sessions.no_other_sessions')}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className={classNames(
                    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-6 py-[18px] min-h-[76px] mobile:min-h-0 mobile:gap-x-3 mobile:gap-y-2 mobile:p-4 desktop:max-[800px]:min-h-0 desktop:max-[800px]:gap-x-3 desktop:max-[800px]:gap-y-2 desktop:max-[800px]:p-4',
                    layoutClassNames.row
                  )}
                >
                  <div className="col-start-1 flex flex-col gap-1 min-w-0">
                    {isLoading ? (
                      <div className="text-xs text-muted overflow-hidden text-ellipsis whitespace-nowrap">
                        {t('account_center.sessions.loading')}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="text-sm font-medium text-primary cursor-pointer bg-none border-none whitespace-nowrap hover:underline py-0.5"
                        onClick={handleManage}
                      >
                        {t('account_center.security.manage')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {hasLoaded && (grantRows !== undefined || hasGrantLoadingError) && (
            <div className={classNames('flex flex-col gap-1.5', layoutClassNames.section)}>
              <div
                className={classNames(
                  'ps-1 text-sm font-medium text-ink mobile:ps-0',
                  layoutClassNames.sectionTitle
                )}
              >
                {t('account_center.sessions.third_party_apps_title')}
              </div>
              <div
                className={classNames(
                  'bg-elevated rounded-[16px] [overflow:clip]',
                  layoutClassNames.card
                )}
              >
                {hasGrantLoadingError ? (
                  <div className="px-6 py-5 text-sm text-muted text-center">
                    {t('account_center.sessions.third_party_apps_load_failed')}
                  </div>
                ) : grantRows && grantRows.length > 0 ? (
                  grantRows.map((app) => (
                    <GrantRow
                      key={app.applicationId}
                      app={app}
                      isEditable={isEditable}
                      isRemoving={removingAppId === app.applicationId}
                      onRevoke={() => {
                        setRevokeGrantTarget(app);
                      }}
                    />
                  ))
                ) : (
                  <div className="px-6 py-5 text-sm text-muted text-center">
                    {t('account_center.sessions.no_third_party_apps')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <PageFooter />
      </div>

      <ConfirmModal
        isOpen={Boolean(revokeTarget)}
        title="account_center.sessions.revoke_session_title"
        confirmText="account_center.sessions.revoke_session"
        confirmButtonType="danger"
        cancelText="action.cancel"
        onConfirm={() => {
          void handleConfirmRevoke();
        }}
        onCancel={() => {
          setRevokeTarget(undefined);
        }}
      >
        {t('account_center.sessions.revoke_session_description')}
      </ConfirmModal>

      <ConfirmModal
        isOpen={Boolean(revokeGrantTarget)}
        title="account_center.sessions.revoke_grant_title"
        confirmText="account_center.sessions.revoke_grant"
        confirmButtonType="danger"
        cancelText="action.cancel"
        onConfirm={() => {
          void handleConfirmRevokeGrant();
        }}
        onCancel={() => {
          setRevokeGrantTarget(undefined);
        }}
      >
        {t('account_center.sessions.revoke_grant_description')}
      </ConfirmModal>
    </>
  );
};

export default Sessions;

/* eslint-enable max-lines */
