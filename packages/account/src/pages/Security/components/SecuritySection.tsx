import classNames from 'classnames';
import { type ReactNode } from 'react';

import { layoutClassNames } from '@ac/constants/layout';

type Props = {
  readonly title: string;
  /** Optional content rendered between the section title and the card, e.g. an inline warning. */
  readonly notification?: ReactNode;
  readonly children: ReactNode;
};

const SecuritySection = ({ title, notification, children }: Props) => (
  <div className={classNames('flex flex-col gap-1.5', layoutClassNames.section)}>
    <div
      className={classNames(
        'ps-1 text-sm font-medium text-ink mobile:ps-0',
        layoutClassNames.sectionTitle
      )}
    >
      {title}
    </div>
    {notification}
    <div
      className={classNames('bg-elevated rounded-[16px] [overflow:clip]', layoutClassNames.card)}
    >
      {children}
    </div>
  </div>
);

export default SecuritySection;
