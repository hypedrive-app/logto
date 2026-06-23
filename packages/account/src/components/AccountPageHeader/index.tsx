import DynamicT from '@experience/shared/components/DynamicT';
import classNames from 'classnames';
import type { TFuncKey } from 'i18next';

import { useAccountLayout } from '@ac/Providers/AccountLayoutContext';
import { layoutClassNames } from '@ac/constants/layout';

type Props = {
  readonly titleKey: TFuncKey;
  readonly descriptionKey: TFuncKey;
};

const AccountPageHeader = ({ titleKey, descriptionKey }: Props) => {
  const { showsMobileTabNav } = useAccountLayout();

  if (showsMobileTabNav) {
    return null;
  }

  return (
    <div className="mb-5 mobile:mb-4">
      <div
        className={classNames('text-xl font-semibold text-ink', layoutClassNames.pageTitle)}
      >
        <DynamicT forKey={titleKey} />
      </div>
      <div
        className={classNames(
          'mt-1 text-sm text-muted mobile:mt-1.5',
          layoutClassNames.pageDescription
        )}
      >
        <DynamicT forKey={descriptionKey} />
      </div>
    </div>
  );
};

export default AccountPageHeader;
