import type { AdminConsoleKey } from '@logto/phrases';
import { conditionalString } from '@silverhand/essentials';
import classNames from 'classnames';
import type { ReactNode } from 'react';

import ArrowDown from '@/assets/icons/arrow-down.svg?react';
import ArrowUp from '@/assets/icons/arrow-up.svg?react';
import Tip from '@/assets/icons/tip.svg?react';
import Card from '@/ds-components/Card';
import DynamicT from '@/ds-components/DynamicT';
import IconButton from '@/ds-components/IconButton';
import { ToggleTip } from '@/ds-components/Tip';
import type { Props as ToggleTipProps } from '@/ds-components/Tip/ToggleTip';
import { formatNumberWithComma } from '@/utils/number';

import styles from './Block.module.scss';

type Props = {
  readonly count: number;
  readonly delta?: number;
  readonly title: AdminConsoleKey;
  readonly tip?: ToggleTipProps['content'];
  readonly variant?: 'bordered' | 'default' | 'plain';
  /** Optional leading metric icon for visual hierarchy. */
  readonly icon?: ReactNode;
  /** Optional comparison caption under the number, e.g. "vs yesterday". */
  readonly caption?: ReactNode;
};

/**
 * Relative change as a percentage of the previous period. `delta` is the
 * absolute change, so the previous value is `count - delta`; guard the zero
 * baseline (a jump from 0 has no meaningful percentage).
 */
const percentLabel = (count: number, delta: number): string | undefined => {
  const previous = count - delta;
  if (previous <= 0) {
    return undefined;
  }
  const pct = Math.round((delta / previous) * 100);
  return `${conditionalString(pct >= 0 && '+')}${pct}%`;
};

function Block({ variant = 'default', count, delta, title, tip, icon, caption }: Props) {
  // Relative figure for the badge; falls back to the absolute change when there
  // is no meaningful baseline (e.g. growth from 0) so the trend is still shown.
  const pct = delta === undefined ? undefined : percentLabel(count, delta);
  const deltaLabel =
    delta === undefined
      ? undefined
      : (pct ?? `${conditionalString(delta >= 0 && '+')}${delta}`);

  return (
    <Card className={classNames(styles.block, styles[variant])}>
      <div className={styles.title}>
        {icon && (variant === 'default' || variant === 'bordered') && (
          <span className={styles.icon}>{icon}</span>
        )}
        <span className={styles.titleText}>
          <DynamicT forKey={title} />
        </span>
        {tip && (
          <ToggleTip anchorClassName={styles.toggleTipButton} content={tip}>
            <IconButton size="small">
              <Tip />
            </IconButton>
          </ToggleTip>
        )}
      </div>
      <div className={styles.number}>{formatNumberWithComma(count)}</div>
      {(deltaLabel ?? caption) && (
        <div className={styles.trend}>
          {delta !== undefined && deltaLabel && (
            <span className={classNames(styles.delta, delta < 0 && styles.down)}>
              {delta > 0 && <ArrowUp />}
              {delta < 0 && <ArrowDown />}
              {deltaLabel}
            </span>
          )}
          {caption && <span className={styles.caption}>{caption}</span>}
        </div>
      )}
    </Card>
  );
}

export default Block;
