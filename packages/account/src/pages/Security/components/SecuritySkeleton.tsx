import classNames from 'classnames';
import { type ReactNode } from 'react';

import { layoutClassNames } from '@ac/constants/layout';

const skeletonBlock =
  'relative overflow-hidden rounded-[13px] bg-surface-2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] bg-[length:200%_100%] bg-no-repeat animate-[shimmer_2s_infinite]';

type SecuritySkeletonProps = {
  readonly ariaLabel: string;
  readonly children: ReactNode;
};

/** Accessible loading container shared by the security sections. */
export const SecuritySkeleton = ({ ariaLabel, children }: SecuritySkeletonProps) => (
  <div
    className="flex flex-col"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={ariaLabel}
  >
    {children}
  </div>
);

type SecuritySkeletonBlockProps = {
  readonly className?: string;
};

/** A single shimmering placeholder block. */
const SecuritySkeletonBlock = ({ className }: SecuritySkeletonBlockProps) => (
  <div className={classNames(skeletonBlock, className)} />
);

type SecurityRowSkeletonProps = {
  readonly hasAction: boolean;
};

/** Placeholder mirroring a single `SecurityRow` while data is loading. */
export const SecurityRowSkeleton = ({ hasAction }: SecurityRowSkeletonProps) => (
  <div
    className={classNames(
      'items-center not-last:border-b not-last:border-line',
      'desktop:grid desktop:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] desktop:[grid-auto-flow:dense] desktop:gap-x-6 desktop:px-6 desktop:py-5 desktop:min-h-[76px]',
      'mobile:flex mobile:flex-col mobile:items-stretch mobile:gap-1 mobile:p-4',
      layoutClassNames.row
    )}
  >
    <div className="desktop:contents mobile:flex mobile:items-center mobile:justify-between mobile:gap-3 mobile:w-full">
      <div className="flex items-center justify-self-start shrink-0 desktop:col-start-1 desktop:row-start-1">
        <SecuritySkeletonBlock className="w-5 h-5 rounded-full" />
      </div>
      {hasAction && (
        <div className="flex items-center gap-4 shrink-0 desktop:col-start-3 mobile:flex-wrap mobile:justify-end">
          <SecuritySkeletonBlock className="w-14 h-4" />
        </div>
      )}
    </div>
    <div className="min-w-0 desktop:col-start-1 desktop:row-start-1 desktop:ps-[calc(20px+1rem)] mobile:ps-0 mobile:w-full">
      <SecuritySkeletonBlock className="w-[120px] max-w-full h-4 mobile:w-[140px]" />
    </div>
    <div className="flex items-center min-w-0 desktop:col-start-2 mobile:w-full mobile:items-start">
      <SecuritySkeletonBlock className="w-40 max-w-[70%] h-6 mobile:max-w-full mobile:w-[180px]" />
    </div>
  </div>
);
