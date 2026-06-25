import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import ArrowLeft from '@/assets/icons/arrow-left.svg?react';
import ArrowRight from '@/assets/icons/arrow-right.svg?react';
import useCacheValue from '@/hooks/use-cache-value';

import Button from '../Button';
import DangerousRaw from '../DangerousRaw';
import FlipOnRtl from '../FlipOnRtl';

import styles from './index.module.scss';
import { getPaginationRange } from './use-pagination-range';

export type Props = {
  readonly page: number;
  readonly totalCount?: number;
  readonly pageSize: number;
  readonly className?: string;
  readonly mode?: 'normal' | 'pico';
  readonly onChange?: (pageIndex: number) => void;
  /**
   * When `true`, `totalCount` is a lower bound (server short-circuited at a cap).
   * Renders Prev/Next only — the numbered jumper and position label are hidden.
   */
  readonly isTotalCountCapped?: boolean;
};

function Pagination({
  page,
  totalCount,
  pageSize,
  className,
  mode = 'normal',
  onChange,
  isTotalCountCapped,
}: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  /**
   * Note:
   * The `totalCount` will become `undefined` temporarily when fetching data on page changes, and this causes the pagination to disappear.
   * Cache `totalCount` to solve this problem.
   */
  const cachedTotalCount = useCacheValue(totalCount) ?? 0;
  const cachedIsTotalCountCapped = useCacheValue(isTotalCountCapped) ?? false;
  const isPicoMode = mode === 'pico';

  if (cachedIsTotalCountCapped) {
    // Pico mode is intentionally not applied here — the `.pico` overrides
    // target `.pagination` (ReactPaginate), which the capped path doesn't use.
    return (
      <div className={classNames(styles.container, className)}>
        <div className={styles.cappedNav}>
          <Button
            className={styles.button}
            size="small"
            icon={
              <FlipOnRtl>
                <ArrowLeft />
              </FlipOnRtl>
            }
            aria-label={t('general.back')}
            disabled={page === 1}
            onClick={() => {
              onChange?.(page - 1);
            }}
          />
          <Button
            className={styles.button}
            size="small"
            icon={
              <FlipOnRtl>
                <ArrowRight />
              </FlipOnRtl>
            }
            aria-label={t('general.next')}
            onClick={() => {
              onChange?.(page + 1);
            }}
          />
        </div>
      </div>
    );
  }

  const pageCount = Math.ceil(cachedTotalCount / pageSize);

  if (pageCount <= 1) {
    return null;
  }

  const min = (page - 1) * pageSize + 1;
  const max = Math.min(page * pageSize, cachedTotalCount);

  // In pico mode only the prev/next controls are shown (no numbered pages), matching the
  // previous `pageRangeDisplayed={-1}` / `marginPagesDisplayed={0}` behavior.
  const pages = isPicoMode ? [] : getPaginationRange({ pageCount, page });

  return (
    <div className={classNames(styles.container, isPicoMode && styles.pico, className)}>
      <div className={styles.positionInfo}>
        {t('general.page_info', { min, max, total: cachedTotalCount })}
      </div>
      <ul className={styles.pagination}>
        <li>
          <Button
            className={styles.button}
            size="small"
            icon={
              <FlipOnRtl>
                <ArrowLeft />
              </FlipOnRtl>
            }
            aria-label={t('general.back')}
            disabled={page === 1}
            onClick={() => {
              onChange?.(page - 1);
            }}
          />
        </li>
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            // eslint-disable-next-line react/no-array-index-key
            <li key={`ellipsis-${index}`} className={styles.disabled}>
              <Button className={styles.button} size="small" title={<DangerousRaw>...</DangerousRaw>} />
            </li>
          ) : (
            <li key={item}>
              <Button
                type={item === page ? 'outline' : 'default'}
                className={classNames(styles.button, item === page && styles.active)}
                size="small"
                title={<DangerousRaw>{item}</DangerousRaw>}
                onClick={() => {
                  onChange?.(item);
                }}
              />
            </li>
          )
        )}
        <li>
          <Button
            className={styles.button}
            size="small"
            icon={
              <FlipOnRtl>
                <ArrowRight />
              </FlipOnRtl>
            }
            aria-label={t('general.next')}
            disabled={page === pageCount}
            onClick={() => {
              onChange?.(page + 1);
            }}
          />
        </li>
      </ul>
    </div>
  );
}

export default Pagination;
