import { getBrandingLogoUrl } from '@experience/shared/utils/logo';
import { useContext } from 'react';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import LoadingIcon from '@ac/assets/icons/loading-icon.svg?react';

const GlobalLoading = () => {
  const { theme, experienceSettings } = useContext(PageContext);

  const logoUrl =
    experienceSettings &&
    getBrandingLogoUrl({
      theme,
      branding: experienceSettings.branding,
      isDarkModeEnabled: experienceSettings.color.isDarkModeEnabled,
    });

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-bg mobile:bg-elevated">
      {logoUrl && <img className="max-h-10 w-auto object-contain" src={logoUrl} alt="logo" />}
      <LoadingIcon className="text-ink animate-[rotating_1s_steps(12,end)_infinite]" />
    </div>
  );
};

export default GlobalLoading;
