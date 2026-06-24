import classNames from 'classnames';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';

const linkClass =
  'text-sm font-medium text-muted no-underline whitespace-nowrap hover:text-ink mobile:whitespace-normal';

const PageFooter = () => {
  const { t } = useTranslation();
  const { experienceSettings } = useContext(PageContext);
  const { termsOfUseUrl, privacyPolicyUrl, supportEmail, supportWebsiteUrl } =
    experienceSettings ?? {};
  // Use `||` to treat empty string as missing so the mailto fallback works
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const supportLink = supportWebsiteUrl || (supportEmail ? `mailto:${supportEmail}` : undefined);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const hasLinks = termsOfUseUrl || privacyPolicyUrl || supportLink;

  return (
    <footer
      className={classNames(
        'w-full min-w-0 box-border flex items-center py-1 px-2 mobile:flex-wrap mobile:justify-center mobile:gap-x-3 mobile:gap-y-1',
        hasLinks ? 'justify-between' : 'justify-center'
      )}
    >
      <div className="min-w-0 flex items-center gap-6 mobile:flex-wrap mobile:justify-center mobile:gap-x-4 mobile:gap-y-1">
        {termsOfUseUrl && (
          <a className={linkClass} href={termsOfUseUrl} target="_blank" rel="noopener noreferrer">
            {t('description.terms_of_use')}
          </a>
        )}
        {privacyPolicyUrl && (
          <a className={linkClass} href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
            {t('description.privacy_policy')}
          </a>
        )}
        {supportLink && (
          <a className={linkClass} href={supportLink} target="_blank" rel="noopener noreferrer">
            {t('account_center.page.support')}
          </a>
        )}
      </div>
    </footer>
  );
};

export default PageFooter;
