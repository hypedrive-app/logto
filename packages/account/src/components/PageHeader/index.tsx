import { getBrandingLogoUrl } from '@experience/shared/utils/logo';
import classNames from 'classnames';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import { layoutClassNames } from '@ac/constants/layout';

const PageHeader = () => {
  const { t } = useTranslation();
  const { theme, experienceSettings } = useContext(PageContext);

  const logoUrl =
    experienceSettings &&
    getBrandingLogoUrl({
      theme,
      branding: experienceSettings.branding,
      isDarkModeEnabled: experienceSettings.color.isDarkModeEnabled,
    });

  return (
    <header
      className={classNames(
        'flex items-center justify-between py-5 px-6 mobile:py-4 mobile:px-5 mobile:bg-bg',
        layoutClassNames.pageHeader
      )}
    >
      <div className="flex items-center gap-4">
        {logoUrl && (
          <>
            <img className="block h-6" src={logoUrl} alt="logo" />
            <div className="w-px h-4 bg-[var(--color-line-divider)]" />
          </>
        )}
        <span className="text-xl font-semibold text-ink whitespace-nowrap">
          {t('account_center.page.title')}
        </span>
      </div>
    </header>
  );
};

export default PageHeader;
