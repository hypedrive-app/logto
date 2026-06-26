import { AccountCenterControlValue } from '@logto/schemas';
import classNames from 'classnames';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import PasswordIcon from '@ac/assets/icons/password.svg?react';
import { layoutClassNames } from '@ac/constants/layout';
import { passwordRoute } from '@ac/constants/routes';
import { getPendingReturn, setPendingReturn } from '@ac/utils/account-center-route';
import { canOpenPasswordEditFlow } from '@ac/utils/security-page';

const PasswordSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userInfo, accountCenterSettings } = useContext(PageContext);

  const passwordControl = accountCenterSettings?.fields.password;

  if (!passwordControl || passwordControl === AccountCenterControlValue.Off) {
    return null;
  }

  return (
    <div className={classNames('flex flex-col gap-1.5', layoutClassNames.section)}>
      <div
        className={classNames(
          'ps-1 text-sm font-medium text-ink mobile:ps-0',
          layoutClassNames.sectionTitle
        )}
      >
        {t('account_center.security.password')}
      </div>
      <div
        className={classNames('bg-elevated rounded-[16px] [overflow:clip]', layoutClassNames.card)}
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
            <div className="flex items-center justify-self-start shrink-0 desktop:col-start-1 desktop:row-start-1">
              <PasswordIcon className="w-5 h-5 text-ink" />
            </div>
            {canOpenPasswordEditFlow(passwordControl, userInfo, accountCenterSettings.fields) && (
              <button
                type="button"
                className="text-sm font-medium text-primary cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:col-start-3 desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start"
                onClick={() => {
                  setPendingReturn(getPendingReturn() ?? window.location.href);
                  void navigate(passwordRoute);
                }}
              >
                {t('account_center.security.change')}
              </button>
            )}
          </div>
          <div className="min-w-0 text-sm font-medium text-ink desktop:col-start-1 desktop:row-start-1 desktop:ps-[calc(20px+1rem)] mobile:ps-0 mobile:w-full">
            {t('account_center.security.password')}
          </div>
          <div className="flex items-center min-w-0 desktop:col-start-2 mobile:w-full mobile:items-start">
            {userInfo?.hasPassword ? (
              <span className="chip chip-success mobile:max-w-full mobile:flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                {t('account_center.security.configured')}
              </span>
            ) : (
              <span className="text-sm text-muted">
                {t('account_center.security.not_configured')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordSection;
