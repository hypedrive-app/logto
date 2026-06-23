import LogtoSignature from '@experience/shared/components/LogtoSignature';
import { LogtoProvider, ReservedScope, useLogto, UserScope } from '@logto/react';
import { accountCenterApplicationId, SignInIdentifier } from '@logto/schemas';
import classNames from 'classnames';
import { useContext, useMemo } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import AppBoundary from '@ac/Providers/AppBoundary';
import LoadingContextProvider from '@ac/Providers/LoadingContextProvider';
import MobileTabNav from '@ac/components/MobileTabNav';
import PageHeader from '@ac/components/PageHeader';
import Sidebar from '@ac/components/Sidebar';
import { layoutClassNames } from '@ac/constants/layout';

import './index.css';
import Callback from './Callback';
import { AccountLayoutProvider } from './Providers/AccountLayoutContext';
import ErrorBoundary from './Providers/AppBoundary/ErrorBoundary';
import LogtoErrorBoundary from './Providers/AppBoundary/LogtoErrorBoundary';
import PageContextProvider from './Providers/PageContextProvider';
import PageContext from './Providers/PageContextProvider/PageContext';
import GlobalLoading from './components/GlobalLoading';
import {
  securityRoute,
  sessionsRoute,
  profileRoute,
  emailRoute,
  emailSuccessRoute,
  phoneRoute,
  phoneSuccessRoute,
  passwordRoute,
  passwordSuccessRoute,
  usernameRoute,
  usernameSuccessRoute,
  authenticatorAppRoute,
  authenticatorAppReplaceRoute,
  authenticatorAppSuccessRoute,
  authenticatorAppReplaceSuccessRoute,
  backupCodesGenerateRoute,
  backupCodesRegenerateRoute,
  backupCodesSuccessRoute,
  backupCodesManageRoute,
  passkeyAddRoute,
  passkeyManageRoute,
  passkeySuccessRoute,
  socialSuccessRoute,
  socialCallbackRoutePrefix,
  socialRoutePrefix,
  verifiedActionRoute,
} from './constants/routes';
import initI18n from './i18n/init';
import BackupCodeBinding from './pages/BackupCodeBinding';
import BackupCodeView from './pages/BackupCodeView';
import Email from './pages/Email';
import Home from './pages/Home';
import PasskeyBinding from './pages/PasskeyBinding';
import PasskeyView from './pages/PasskeyView';
import Password from './pages/Password';
import Phone from './pages/Phone';
import Profile from './pages/Profile';
import Security from './pages/Security';
import Sessions from './pages/Sessions';
import SocialCallback from './pages/SocialCallback';
import SocialFlow from './pages/SocialFlow';
import TotpBinding from './pages/TotpBinding';
import UpdateSuccess from './pages/UpdateSuccess';
import Username from './pages/Username';
import VerifiedAction from './pages/VerifiedAction';
import { useAuthRedirect } from './use-auth-redirect';
import { accountCenterBasePath, handleAccountCenterRoute } from './utils/account-center-route';
import { getAccountTabSettings } from './utils/account-tabs';
import {
  hasVisibleProfilePage,
  hasVisibleSecuritySection,
  hasVisibleSessionsPage,
} from './utils/security-page';
// normalized.scss removed — normalization handled by experience panda.config globalCss

handleAccountCenterRoute();
void initI18n();

export const Main = () => {
  const params = new URLSearchParams(window.location.search);
  const { pathname } = window.location;
  const isAccountRoot =
    pathname === accountCenterBasePath || pathname === `${accountCenterBasePath}/`;
  const isSocialCallback = pathname.startsWith(
    `${accountCenterBasePath}${socialCallbackRoutePrefix}/`
  );
  const isAuthCallback = Boolean(params.get('code')) && isAccountRoot;
  const isSilentAuthFailed = params.get('error') === 'login_required' && isAccountRoot;
  const isInCallback = isSocialCallback || isAuthCallback;
  const { isAuthenticated, isLoading } = useLogto();
  const {
    accountCenterSettings,
    experienceSettings,
    isLoadingExperience,
    isLoadingUserInfo,
    userInfo,
  } = useContext(PageContext);
  const isInitialAuthLoading = !isAuthenticated && isLoading;

  useAuthRedirect({ isInCallback: isInCallback || isAccountRoot, isSilentAuthFailed });

  if (isSocialCallback) {
    return (
      <Routes>
        <Route path={`${socialCallbackRoutePrefix}/:connectorId`} element={<SocialCallback />} />
      </Routes>
    );
  }

  if (isAuthCallback) {
    return <Callback />;
  }

  if (isLoadingExperience || (!isAccountRoot && (isInitialAuthLoading || isLoadingUserInfo))) {
    return <GlobalLoading />;
  }

  // Account center is explicitly disabled - show error page for all routes
  if (accountCenterSettings?.enabled === false) {
    return (
      <Routes>
        <Route path="*" element={<Home />} />
      </Routes>
    );
  }

  const {
    hasProfile,
    hasSecurity,
    hasSessions,
    navItems: accountNavItems,
  } = getAccountTabSettings({
    accountCenterSettings,
    experienceSettings,
  });

  if (isAccountRoot) {
    const [firstAvailableNavItem] = accountNavItems;

    if (!firstAvailableNavItem) {
      return (
        <Routes>
          <Route path="*" element={<Home />} />
        </Routes>
      );
    }

    return <Navigate replace to={firstAvailableNavItem.to} />;
  }

  if (!userInfo) {
    return <GlobalLoading />;
  }

  return (
    <Routes>
      <Route
        path={emailSuccessRoute}
        element={<UpdateSuccess identifierType={SignInIdentifier.Email} />}
      />
      <Route
        path={phoneSuccessRoute}
        element={<UpdateSuccess identifierType={SignInIdentifier.Phone} />}
      />
      <Route
        path={usernameSuccessRoute}
        element={<UpdateSuccess identifierType={SignInIdentifier.Username} />}
      />
      <Route path={passwordSuccessRoute} element={<UpdateSuccess identifierType="password" />} />
      <Route
        path={authenticatorAppSuccessRoute}
        element={<UpdateSuccess identifierType="totp" />}
      />
      <Route
        path={authenticatorAppReplaceSuccessRoute}
        element={<UpdateSuccess identifierType="totp_replaced" />}
      />
      <Route
        path={backupCodesSuccessRoute}
        element={<UpdateSuccess identifierType="backup_code" />}
      />
      <Route path={passkeySuccessRoute} element={<UpdateSuccess identifierType="passkey" />} />
      <Route path={socialSuccessRoute} element={<UpdateSuccess identifierType="social" />} />
      <Route path={emailRoute} element={<Email />} />
      <Route path={phoneRoute} element={<Phone />} />
      <Route path={passwordRoute} element={<Password />} />
      <Route path={usernameRoute} element={<Username />} />
      <Route path={authenticatorAppReplaceRoute} element={<TotpBinding isReplace />} />
      <Route path={authenticatorAppRoute} element={<TotpBinding />} />
      <Route path={backupCodesGenerateRoute} element={<BackupCodeBinding />} />
      <Route path={backupCodesRegenerateRoute} element={<BackupCodeBinding isRegenerate />} />
      <Route path={backupCodesManageRoute} element={<BackupCodeView />} />
      <Route path={passkeyAddRoute} element={<PasskeyBinding />} />
      <Route path={passkeyManageRoute} element={<PasskeyView />} />
      <Route path={verifiedActionRoute} element={<VerifiedAction />} />
      <Route path={`${socialRoutePrefix}/:connectorId`} element={<SocialFlow mode="add" />} />
      <Route
        path={`${socialRoutePrefix}/:connectorId/change`}
        element={<SocialFlow mode="change" />}
      />
      <Route
        path={`${socialRoutePrefix}/:connectorId/remove`}
        element={<SocialFlow mode="remove" />}
      />
      {hasSecurity && <Route path={securityRoute} element={<Security />} />}
      {hasSessions && <Route path={sessionsRoute} element={<Sessions />} />}
      {hasProfile && <Route path={profileRoute} element={<Profile />} />}
      <Route index element={<Home />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
};

const Layout = () => {
  const { accountCenterSettings, experienceSettings, theme, platform } = useContext(PageContext);
  const hideLogtoBranding = experienceSettings?.hideLogtoBranding === true;
  const { pathname } = useLocation();
  const accountNavItems = useMemo(
    () => getAccountTabSettings({ accountCenterSettings, experienceSettings }).navItems,
    [accountCenterSettings, experienceSettings]
  );
  const isFullPage = accountNavItems.some(({ to }) => to === pathname);
  const showsMultiPageNav = isFullPage && accountNavItems.length > 1;
  const showsMobileTabNav = platform === 'mobile' && showsMultiPageNav;
  const showsSidebar = platform !== 'mobile' && showsMultiPageNav;

  return (
    <div className={classNames('mobile:flex mobile:min-h-screen mobile:flex-col', layoutClassNames.app)}>
      <div
        className={classNames(
          'absolute inset-0 overflow-auto mobile:static mobile:flex mobile:flex-1 mobile:flex-col',
          isFullPage && 'flex flex-col mobile:bg-bg',
          showsMultiPageNav && layoutClassNames.withTabNav,
          layoutClassNames.pageContainer
        )}
      >
        {isFullPage && <PageHeader />}
        {showsMobileTabNav && <MobileTabNav items={accountNavItems} />}
        <div
          className={classNames(
            'flex flex-1 justify-center',
            // Full-page (profile/security/sessions): top-aligned scrollable content
            isFullPage && 'items-start',
            'mobile:flex-col mobile:items-stretch mobile:justify-start mobile:[padding-bottom:env(safe-area-inset-bottom)]',
            // Card mode (home/error/not-found): centre the card both axes
            !isFullPage &&
              'min-h-full flex-col items-center justify-center desktop:p-5',
            !isFullPage && layoutClassNames.cardContainer,
            showsSidebar &&
              'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-6 px-6 max-[1060px]:flex max-[1060px]:justify-center'
          )}
        >
          {showsSidebar && <Sidebar items={accountNavItems} />}
          <AccountLayoutProvider
            value={{
              showsMultiPageNav,
              showsMobileTabNav,
            }}
          >
            <main
              className={classNames(
                isFullPage &&
                  'flex w-[760px] flex-col py-3 max-[800px]:w-auto max-[800px]:p-4 mobile:w-auto mobile:flex-1 mobile:bg-bg mobile:p-4 mobile:px-5',
                !isFullPage &&
                  'flex flex-col items-center mobile:relative mobile:flex-1 mobile:bg-elevated mobile:p-4 mobile:px-5 desktop:relative desktop:min-h-[540px] desktop:w-[540px] desktop:rounded-[16px] desktop:border desktop:border-line desktop:bg-elevated desktop:p-6 desktop:shadow-[var(--edge),var(--sh-float)] max-[580px]:desktop:w-auto max-[580px]:desktop:self-stretch',
                isFullPage ? layoutClassNames.mainContent : layoutClassNames.cardMain
              )}
            >
              <ErrorBoundary>
                <LogtoErrorBoundary>
                  <Main />
                </LogtoErrorBoundary>
              </ErrorBoundary>
              {!isFullPage && !hideLogtoBranding && (
                <LogtoSignature
                  className={classNames(
                    'mobile:my-10 mobile:mb-2',
                    'desktop:absolute desktop:bottom-0 desktop:translate-y-[calc(100%+28px)] desktop:pb-7',
                    layoutClassNames.signature
                  )}
                  theme={theme}
                />
              )}
            </main>
          </AccountLayoutProvider>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <HelmetProvider>
    <BrowserRouter basename={accountCenterBasePath}>
    <LogtoProvider
      config={{
        endpoint: window.location.origin,
        appId: accountCenterApplicationId,
        includeReservedScopes: false,
        scopes: [
          ReservedScope.OpenId,
          UserScope.Profile,
          UserScope.Email,
          UserScope.Phone,
          UserScope.Address,
          UserScope.Identities,
          UserScope.CustomData,
          UserScope.Sessions,
        ],
      }}
    >
      <LoadingContextProvider>
        <PageContextProvider>
          <AppBoundary>
            <Layout />
          </AppBoundary>
        </PageContextProvider>
      </LoadingContextProvider>
    </LogtoProvider>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
