import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { layoutClassNames } from '@ac/constants/layout';

import type { AccountNavItem } from '../account-nav-items';

type Props = {
  readonly items: readonly AccountNavItem[];
};

const MobileTabNav = ({ items }: Props) => {
  const { t } = useTranslation();

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav
      className={classNames(
        'hidden mobile:flex mobile:items-end mobile:gap-6 mobile:px-5 mobile:border-b mobile:border-[var(--color-line-divider)] mobile:bg-bg',
        layoutClassNames.mobileTabNav
      )}
    >
      {items.map(({ to, labelKey }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            classNames(
              'relative py-3 text-sm font-medium no-underline whitespace-nowrap',
              'after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:rounded-t-sm',
              isActive
                ? 'text-primary after:bg-primary'
                : 'text-ink after:bg-transparent',
              layoutClassNames.mobileTabNavItem
            )
          }
        >
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileTabNav;
