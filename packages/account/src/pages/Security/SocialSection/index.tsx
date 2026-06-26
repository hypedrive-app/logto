import DynamicT from '@experience/shared/components/DynamicT';
import { getLogoUrl } from '@experience/shared/utils/logo';
import { AccountCenterControlValue, type Identity } from '@logto/schemas';
import classNames from 'classnames';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import { deleteSocialIdentity } from '@ac/apis/social';
import ConfirmModal from '@ac/components/ConfirmModal';
import { layoutClassNames } from '@ac/constants/layout';
import { getSocialAddRoute, getSocialChangeRoute, verifiedActionRoute } from '@ac/constants/routes';
import useApi from '@ac/hooks/use-api';
import useErrorHandler from '@ac/hooks/use-error-handler';
import { getPendingReturn, setPendingReturn } from '@ac/utils/account-center-route';
import { hasVisibleSocialSection } from '@ac/utils/security-page';
import { sessionStorage } from '@ac/utils/session-storage';
import {
  getAvailableSocialConnectors,
  getLocalizedConnectorName,
} from '@ac/utils/social-connector';

type SocialIdentityDetails = Partial<{
  name: string;
  email: string;
  avatar: string;
}>;

const getSocialIdentityDetail = (identity: Identity, key: keyof SocialIdentityDetails) => {
  const value = identity.details?.[key];

  return typeof value === 'string' ? value : undefined;
};

const truncateSocialUserId = (userId: string) =>
  userId.length <= 14 ? userId : `${userId.slice(0, 8)}...${userId.slice(-4)}`;

const getDisplayProfile = (identity: Identity, fallbackText: string) => {
  const displayName = getSocialIdentityDetail(identity, 'name')?.trim();
  const email = getSocialIdentityDetail(identity, 'email')?.trim();
  const avatar = getSocialIdentityDetail(identity, 'avatar');
  const safeUserId = identity.userId ? truncateSocialUserId(identity.userId) : undefined;
  const primaryText = displayName ?? email ?? safeUserId ?? fallbackText;
  const secondaryText = [email, displayName, safeUserId].find(
    (value) => value && value !== primaryText
  );

  return {
    avatar,
    primaryText,
    secondaryText,
  };
};

const SocialSection = () => {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const navigate = useNavigate();
  const {
    accountCenterSettings,
    experienceSettings,
    theme,
    userInfo,
    verificationId,
    setVerificationId,
    refreshUserInfo,
    setToast,
  } = useContext(PageContext);
  const handleError = useErrorHandler();
  const deleteSocialIdentityRequest = useApi(deleteSocialIdentity);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>();

  const socialControl = accountCenterSettings?.fields.social;

  const connectors = useMemo(
    () => getAvailableSocialConnectors(experienceSettings?.socialConnectors ?? []),
    [experienceSettings?.socialConnectors]
  );

  const items = useMemo(
    () =>
      connectors
        .map((connector) => ({
          connector,
          connectorName: getLocalizedConnectorName(connector, language),
          identity: userInfo?.identities?.[connector.target],
        }))
        .slice()
        .sort((left, right) => Number(Boolean(right.identity)) - Number(Boolean(left.identity))),
    [connectors, language, userInfo?.identities]
  );

  const selectedConnector = connectors.find(({ id }) => id === selectedConnectorId);
  const selectedConnectorName =
    selectedConnector && getLocalizedConnectorName(selectedConnector, language);
  const currentPageUrl = `${window.location.origin}${window.location.pathname}`;

  const navigateTo = useCallback(
    (route: string) => {
      setPendingReturn(getPendingReturn() ?? window.location.href);
      void navigate(route);
    },
    [navigate]
  );

  const removeSocialIdentityForConnector = useCallback(
    async (connectorId: string, verifiedId: string) => {
      const connector = connectors.find(({ id }) => id === connectorId);

      if (!connector) {
        return;
      }

      const connectorName = getLocalizedConnectorName(connector, language);
      const [error] = await deleteSocialIdentityRequest(verifiedId, connector.target);

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
      setToast(t('account_center.social.removed', { connector: connectorName }));
    },
    [
      connectors,
      deleteSocialIdentityRequest,
      handleError,
      language,
      refreshUserInfo,
      setToast,
      setVerificationId,
      t,
    ]
  );

  const handleRemoveConfirm = useCallback(async () => {
    if (!selectedConnectorId) {
      return;
    }

    const connectorId = selectedConnectorId;
    setSelectedConnectorId(undefined);

    if (verificationId) {
      await removeSocialIdentityForConnector(connectorId, verificationId);
      return;
    }

    sessionStorage.setPendingVerifiedAction('remove-social');
    sessionStorage.setPendingSocialRemoveConnectorId(connectorId);
    navigateTo(verifiedActionRoute);
  }, [navigateTo, removeSocialIdentityForConnector, selectedConnectorId, verificationId]);

  useEffect(() => {
    if (!verificationId) {
      return;
    }

    if (sessionStorage.getPendingVerifiedAction() !== 'remove-social') {
      return;
    }

    const connectorId = sessionStorage.getPendingSocialRemoveConnectorId();

    if (!connectorId) {
      return;
    }

    sessionStorage.clearPendingVerifiedAction();
    sessionStorage.clearPendingSocialRemoveConnectorId();
    void removeSocialIdentityForConnector(connectorId, verificationId);
  }, [removeSocialIdentityForConnector, verificationId]);

  if (!hasVisibleSocialSection(socialControl, experienceSettings)) {
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
          {t('account_center.security.social_sign_in')}
        </div>
        <div
          className={classNames(
            'bg-elevated rounded-[16px] [overflow:clip]',
            layoutClassNames.card
          )}
        >
          {items.map(({ connector, connectorName, identity }) => {
            const profile = identity && getDisplayProfile(identity, connectorName);

            return (
              <div
                key={connector.id}
                className={classNames(
                  'grid items-center not-last:border-b not-last:border-line',
                  // Wide desktop: three columns.
                  'desktop:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] desktop:[grid-auto-flow:dense] desktop:gap-x-4 desktop:px-6 desktop:py-[18px] desktop:min-h-[76px]',
                  // Mobile: stacked two-column grid.
                  'mobile:grid-cols-[minmax(0,1fr)_auto] mobile:min-h-0 mobile:gap-x-3 mobile:gap-y-2 mobile:p-4',
                  // Narrow desktop (<=800px): same stacked layout as mobile.
                  'desktop:max-[800px]:grid-cols-[minmax(0,1fr)_auto] desktop:max-[800px]:[grid-auto-flow:row] desktop:max-[800px]:gap-x-3 desktop:max-[800px]:gap-y-2 desktop:max-[800px]:p-4 desktop:max-[800px]:min-h-0',
                  layoutClassNames.row
                )}
              >
                <div className="flex items-center gap-4 min-w-0 desktop:col-start-1 desktop:max-[800px]:contents mobile:contents">
                  <img
                    className="w-5 h-5 rounded-[8px] shrink-0 desktop:max-[800px]:col-start-1 desktop:max-[800px]:row-start-1 mobile:col-start-1 mobile:row-start-1"
                    src={getLogoUrl({
                      theme,
                      logoUrl: connector.logo,
                      darkLogoUrl: connector.logoDark,
                    })}
                    alt={connectorName}
                  />
                  <div className="min-w-0 text-sm font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap desktop:max-[800px]:col-span-full desktop:max-[800px]:row-start-2 desktop:max-[800px]:w-full desktop:max-[800px]:whitespace-normal desktop:max-[800px]:break-words desktop:max-[800px]:[overflow-wrap:anywhere] mobile:col-span-full mobile:row-start-2 mobile:w-full mobile:whitespace-normal mobile:break-words mobile:[overflow-wrap:anywhere]">
                    {connectorName}
                  </div>
                </div>
                <div className="flex items-center gap-3 min-w-0 desktop:col-start-2 desktop:max-[800px]:col-span-full desktop:max-[800px]:row-start-3 desktop:max-[800px]:w-full desktop:max-[800px]:items-start mobile:col-span-full mobile:row-start-3 mobile:w-full mobile:items-start">
                  {profile ? (
                    <>
                      {profile.avatar && (
                        <img
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          src={profile.avatar}
                          alt={profile.primaryText}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-ink mobile:break-words mobile:[overflow-wrap:anywhere]">
                          {profile.primaryText}
                        </div>
                        {profile.secondaryText && (
                          <div className="mt-0.5 text-xs text-muted mobile:break-words mobile:[overflow-wrap:anywhere]">
                            {profile.secondaryText}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0 text-sm text-muted mobile:w-full mobile:break-words mobile:[overflow-wrap:anywhere]">
                      {t('account_center.security.social_not_linked')}
                    </div>
                  )}
                </div>
                {socialControl === AccountCenterControlValue.Edit && (
                  <div className="flex items-center gap-4 shrink-0 desktop:col-start-3 desktop:max-[800px]:col-start-2 desktop:max-[800px]:row-start-1 desktop:max-[800px]:justify-self-end desktop:max-[800px]:justify-end mobile:col-start-2 mobile:row-start-1 mobile:justify-self-end mobile:justify-end">
                    {identity ? (
                      <>
                        <button
                          type="button"
                          className="text-sm font-medium text-primary cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start"
                          onClick={() => {
                            setPendingReturn(getPendingReturn() ?? currentPageUrl);
                            void navigate(getSocialChangeRoute(connector.id));
                          }}
                        >
                          {t('account_center.security.change')}
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-danger cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start"
                          onClick={() => {
                            setSelectedConnectorId(connector.id);
                          }}
                        >
                          {t('account_center.security.remove')}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="text-sm font-medium text-primary cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start"
                        onClick={() => {
                          setPendingReturn(getPendingReturn() ?? currentPageUrl);
                          void navigate(getSocialAddRoute(connector.id));
                        }}
                      >
                        {t('account_center.security.add')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {selectedConnector && selectedConnectorName && (
        <ConfirmModal
          isOpen
          title="action.remove"
          confirmText="action.remove"
          confirmButtonType="danger"
          onCancel={() => {
            setSelectedConnectorId(undefined);
          }}
          onConfirm={() => {
            void handleRemoveConfirm();
          }}
        >
          <DynamicT
            forKey="account_center.social.remove_confirmation_description"
            interpolation={{ connector: selectedConnectorName }}
          />
        </ConfirmModal>
      )}
    </>
  );
};

export default SocialSection;
