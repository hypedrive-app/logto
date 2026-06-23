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
      className={classNames(
        'flex items-center p-3 text-sm mx-auto mb-2 surface-warning',
        className
      )}
    >
      <DynamicT forKey={message} />
    </div>
  );
};

export default InlineNotification;
