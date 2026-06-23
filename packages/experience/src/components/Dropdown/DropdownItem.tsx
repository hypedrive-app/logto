import classNames from 'classnames';
import type { MouseEvent, KeyboardEvent, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { onKeyDownHandler } from '@/shared/utils/a11y';

const itemClass =
  'p-2 rounded-[11px] text-sm cursor-pointer flex items-center overflow-hidden gap-4 border border-transparent overlay-hover focus-visible:border-primary focus-visible:outline-none';

const typeClass = {
  default: '',
  danger: 'text-danger',
} as const;

export type Props = {
  readonly className?: string;
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly iconClassName?: string;
  readonly type?: 'default' | 'danger';
  readonly onClick?: (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
  readonly onArrowNavigate?: (direction: 1 | -1) => void;
};

const DropdownItem = (
  {
    className = '',
    children,
    icon,
    iconClassName = '',
    type = 'default',
    onClick,
    onArrowNavigate,
  }: Props,
  ref: Ref<HTMLDivElement>
) => (
  <div
    ref={ref}
    className={classNames(itemClass, typeClass[type], className)}
    role="menuitem"
    tabIndex={0}
    onMouseDown={(event) => {
      event.preventDefault();
    }}
    onKeyDown={(event) => {
      if (event.key === 'ArrowDown') {
        onArrowNavigate?.(1);
        event.preventDefault();
        return;
      }
      if (event.key === 'ArrowUp') {
        onArrowNavigate?.(-1);
        event.preventDefault();
        return;
      }
      onKeyDownHandler(onClick)(event);
    }}
    onClick={onClick}
  >
    {icon && <span className={classNames('flex items-center', iconClassName)}>{icon}</span>}
    {children}
  </div>
);

export default forwardRef<HTMLDivElement, Props>(DropdownItem);
