import classNames from 'classnames';

import { SecurityRowSkeleton } from '../components/SecuritySkeleton';

const skeletonBlock =
  'relative overflow-hidden rounded-[13px] bg-surface-2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] bg-[length:200%_100%] bg-no-repeat animate-[shimmer_2s_infinite]';

type Props = {
  readonly hasToggle: boolean;
  readonly rows: ReadonlyArray<{
    readonly key: string;
    readonly action?: unknown;
  }>;
};

const MfaSkeleton = ({ hasToggle, rows }: Props) => (
  <>
    {hasToggle && (
      <div className="flex items-center gap-6 px-6 py-5 mobile:gap-3 mobile:p-4">
        <div className="flex-1 flex flex-col gap-1 min-w-0 mobile:gap-1.5">
          <div
            className={classNames(skeletonBlock, 'w-[200px] max-w-[60%] h-4 mobile:max-w-full')}
          />
          <div className={classNames(skeletonBlock, 'w-[360px] max-w-full h-3.5')} />
        </div>
        <div className={classNames(skeletonBlock, 'w-11 h-6 shrink-0 rounded-full')} />
      </div>
    )}
    {hasToggle && rows.length > 0 && <div className="h-px bg-line" />}
    {rows.map(({ key, action }) => (
      <SecurityRowSkeleton key={key} hasAction={Boolean(action)} />
    ))}
  </>
);

export default MfaSkeleton;
