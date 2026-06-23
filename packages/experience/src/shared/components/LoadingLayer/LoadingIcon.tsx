import classNames from 'classnames';

import LoadingSvg from '@/assets/icons/loading-icon.svg?react';

type Props = {
  readonly className?: string;
};

const LoadingIcon = ({ className }: Props) => (
  <LoadingSvg
    className={classNames(
      'text-ink animate-[rotating_1s_steps(12,end)_infinite] motion-reduce:animate-[rotating_2.4s_steps(12,end)_infinite]',
      className
    )}
  />
);

export default LoadingIcon;
