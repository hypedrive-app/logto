import classNames from 'classnames';
import type { TFuncKey } from 'i18next';

import DynamicT from '@/shared/components/DynamicT';

type Props = {
  readonly className?: string;
  readonly label?: TFuncKey;
};

const Divider = ({ className, label }: Props) => {
  const lineStyle = classNames('flex-1 h-px bg-line', label && 'first:me-4 last:ms-4');

  return (
    <div
      className={classNames('flex items-center text-xs font-medium text-muted', className)}
    >
      <i className={lineStyle} />
      {label && (
        <>
          <DynamicT forKey={label} />
          <i className={lineStyle} />
        </>
      )}
    </div>
  );
};

export default Divider;
