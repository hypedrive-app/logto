import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import type { TFuncKey } from 'i18next';

import DynamicT from '@/shared/components/DynamicT';

type Props = {
  readonly className?: string;
  readonly message: TFuncKey;
};

const InlineNotification = ({ className, message }: Props) => {
  return (
    <div
      role="alert"
      className={classNames(
        // 12px/14px padding + 16px bottom margin for proper breathing room (was p-3/mb-2).
        'flex items-start gap-2.5 px-3.5 py-3 text-sm mx-auto mb-4 surface-warning',
        className
      )}
    >
      <ExclamationTriangleIcon className="w-[18px] h-[18px] mt-px shrink-0 text-[var(--warning)]" />
      <DynamicT forKey={message} />
    </div>
  );
};

export default InlineNotification;
