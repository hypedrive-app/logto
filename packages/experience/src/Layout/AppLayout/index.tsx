import classNames from 'classnames';
import { Outlet } from 'react-router-dom';

import usePlatform from '@/hooks/use-platform';
import { layoutClassNames } from '@/utils/consts';

import CustomContent from './CustomContent';

const AppLayout = () => {
  const { isMobile } = usePlatform();

  return (
    <div className="absolute inset-0 overflow-auto desktop:bg-bg">
      <div
        className={classNames(
          'flex min-h-full flex-col items-center justify-center mobile:[padding-bottom:env(safe-area-inset-bottom)] desktop:p-5',
          layoutClassNames.pageContainer
        )}
      >
        {!isMobile && <CustomContent className={layoutClassNames.customContent} />}
        <main
          className={classNames(
            'flex flex-col items-center',
            'mobile:relative mobile:flex-1 mobile:self-stretch mobile:bg-elevated mobile:px-5 mobile:py-4',
            'desktop:relative desktop:min-h-[480px] desktop:w-[440px] desktop:rounded-[16px] desktop:p-8',
            'desktop:border desktop:border-line desktop:bg-elevated',
            'desktop:shadow-[var(--edge),var(--sh-float)]',
            'desktop:animate-[card-enter_0.4s_var(--ease-out)_both]',
            'max-[580px]:desktop:w-auto max-[580px]:desktop:self-stretch',
            layoutClassNames.mainContent
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
