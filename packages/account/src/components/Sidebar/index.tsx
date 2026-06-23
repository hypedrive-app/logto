import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { layoutClassNames } from '@ac/constants/layout';

import type { AccountNavItem } from '../account-nav-items';

type Props = {
  readonly items: readonly AccountNavItem[];
};

const Sidebar = ({ items }: Props) => {
  const { t } = useTranslation();

  if (items.length === 0) {
    return null;
  }

  return (
    <aside
      className={classNames(
        'w-[220px] flex-shrink-0 justify-self-start py-3 px-2 desktop:max-[1060px]:hidden mobile:hidden',
        layoutClassNames.sidebar
      )}
    >
      <nav className="flex flex-col gap-1">
        {items.map(({ to, labelKey, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-2 py-2 px-3 rounded-[11px] text-sm font-medium no-underline cursor-pointer transition-colors duration-200',
                isActive
                  ? 'bg-surface text-ink font-medium'
                  : 'text-muted overlay-hover',
                layoutClassNames.sidebarItem
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
