import classNames from 'classnames';
import type { HTMLProps, Ref } from 'react';
import { forwardRef } from 'react';

const iconButtonClass =
  'border-none outline-none bg-none border-transparent rounded-[11px] p-1 flex flex-col items-center justify-center cursor-pointer ' +
  '[&>svg]:text-muted active:bg-[var(--color-overlay-neutral-pressed)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-overlay-brand-focused)] focus-visible:outline-offset-1 ' +
  'desktop:hover:[&:not(:active)]:bg-[var(--color-overlay-neutral-hover)]';

export type Props = Omit<HTMLProps<HTMLButtonElement>, 'type'>;

const IconButton = ({ children, className, ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
  return (
    <button ref={ref} type="button" className={classNames(iconButtonClass, className)} {...rest}>
      {children}
    </button>
  );
};

export default forwardRef<HTMLButtonElement, Props>(IconButton);
