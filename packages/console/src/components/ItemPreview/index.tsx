import { conditional } from '@silverhand/essentials';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import type { To } from 'react-router-dom';
import { Link } from 'react-router-dom';

import useTenantPathname from '@/hooks/use-tenant-pathname';

import styles from './index.module.scss';

// When the title/subtitle is plain text, expose it as a native tooltip so the full
// value is reachable on hover even when the cell truncates with an ellipsis.
const overflowTitle = (value: ReactNode): string | undefined =>
  conditional(typeof value === 'string' && value);

type Props = {
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly icon?: ReactNode;
  readonly to?: To;
  readonly size?: 'default' | 'compact';
  readonly suffix?: ReactNode;
  readonly toTarget?: HTMLAnchorElement['target'];
};

function ItemPreview({ title, subtitle, icon, to, size = 'default', suffix, toTarget }: Props) {
  const { getTo } = useTenantPathname();

  return (
    <div className={classNames(styles.item, styles[size])}>
      {icon}
      <div className={styles.content}>
        <div className={styles.meta}>
          {to && (
            <Link
              className={classNames(styles.title, styles.withLink)}
              to={getTo(to)}
              target={toTarget}
              title={overflowTitle(title)}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {title}
            </Link>
          )}
          {!to && (
            <div className={styles.title} title={overflowTitle(title)}>
              {title}
            </div>
          )}
          {subtitle && (
            <div className={styles.subtitle} title={overflowTitle(subtitle)}>
              {subtitle}
            </div>
          )}
        </div>
        {suffix}
      </div>
    </div>
  );
}

export default ItemPreview;
