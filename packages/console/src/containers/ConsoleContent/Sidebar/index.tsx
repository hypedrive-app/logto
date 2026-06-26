import classNames from 'classnames';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { isDevFeaturesEnabled } from '@/consts/env';
import { MobileMenuContext } from '@/containers/AppContent/MobileMenuContext';
import OverlayScrollbar from '@/ds-components/OverlayScrollbar';
import useMatchTenantPath from '@/hooks/use-tenant-pathname';

import Item from './components/Item';
import Section from './components/Section';
import { useSidebarMenuItems } from './hook';
import styles from './index.module.scss';
import { getPath } from './utils';

export function Skeleton() {
  return <div className={styles.skeleton} />;
}

function Sidebar() {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'admin_console.tab_sections',
  });
  const { sections } = useSidebarMenuItems();
  const { match } = useMatchTenantPath();
  const { isOpen: isMobileOpen, close: closeMobileMenu } = useContext(MobileMenuContext);

  return (
    <>
      {/* Backdrop for the mobile drawer. Hidden on desktop via CSS. */}
      <div
        aria-hidden
        className={classNames(styles.backdrop, isMobileOpen && styles.backdropVisible)}
        onClick={closeMobileMenu}
      />
      <div className={classNames(styles.sidebar, isMobileOpen && styles.sidebarOpen)}>
        <OverlayScrollbar className={styles.menu}>
          {/* Navigating closes the drawer on mobile; on desktop close() is a no-op. */}
          <div className={styles.menuContent} onClick={closeMobileMenu}>
            {sections.map(({ title, items }) => (
              <Section key={title} title={t(title)}>
                {items.map(
                  ({ title, Icon, isHidden, modal, externalLink, path }) =>
                    !isHidden && (
                      <Item
                        key={title}
                        titleKey={title}
                        icon={<Icon />}
                        isActive={match('/' + (path ?? getPath(title)))}
                        modal={modal}
                        externalLink={externalLink}
                        path={path}
                      />
                    )
                )}
              </Section>
            ))}
            {isDevFeaturesEnabled && <div aria-hidden className={styles.devStatusSpacer} />}
          </div>
        </OverlayScrollbar>
      </div>
    </>
  );
}

export default Sidebar;

export * from './utils';
