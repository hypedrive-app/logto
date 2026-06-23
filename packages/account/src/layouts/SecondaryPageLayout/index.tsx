import DynamicT from '@experience/shared/components/DynamicT';
import NavBar from '@experience/shared/components/NavBar';
import PageMeta from '@experience/shared/components/PageMeta';
import classNames from 'classnames';
import type { TFuncKey } from 'i18next';
import { type ReactElement } from 'react';

import { layoutClassNames } from '@ac/constants/layout';

type Props = {
  readonly title: TFuncKey;
  readonly description?: TFuncKey | ReactElement | '';
  readonly titleProps?: Record<string, unknown>;
  readonly descriptionProps?: Record<string, unknown>;
  readonly notification?: ReactElement;
  readonly onSkip?: () => void;
  readonly onBack?: () => void;
  readonly isNavBarHidden?: boolean;
  readonly children: React.ReactNode;
};

const SecondaryPageLayout = ({
  title,
  description,
  titleProps,
  descriptionProps,
  notification,
  onSkip,
  onBack,
  isNavBarHidden,
  children,
}: Props) => {
  return (
    <div className={classNames('flex-1 self-stretch', layoutClassNames.secondaryPageWrapper)}>
      <PageMeta titleKey={title} />
      <NavBar isHidden={isNavBarHidden} onSkip={onSkip} onClose={onBack} />
      <div className="w-full max-w-[var(--max-width)] mx-auto my-2 mobile:max-w-none mobile:my-2 desktop:my-12">
        {notification}
        <div className="mb-6 desktop:mb-4">
          <div
            className={classNames(
              'mobile:text-[28px]/[36px] mobile:font-semibold mobile:text-ink desktop:text-2xl desktop:font-semibold desktop:text-ink',
              layoutClassNames.secondaryPageTitle
            )}
          >
            <DynamicT forKey={title} interpolation={titleProps} />
          </div>
          {description && (
            <div
              className={classNames(
                'mt-2 text-sm text-muted',
                layoutClassNames.secondaryPageDescription
              )}
            >
              {typeof description === 'string' ? (
                <DynamicT forKey={description} interpolation={descriptionProps} />
              ) : (
                description
              )}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default SecondaryPageLayout;
