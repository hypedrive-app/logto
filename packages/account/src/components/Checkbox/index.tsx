import CheckboxIcon from '@experience/shared/assets/icons/checkbox-icon.svg?react';
import classNames from 'classnames';
import type { InputHTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';

export type Props = {
  readonly size?: 'small' | 'default';
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

const Checkbox = ({ disabled, size = 'default', ...rest }: Props, ref: Ref<HTMLInputElement>) => {
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        disabled={disabled}
        {...rest}
        ref={ref}
        readOnly
        className="peer absolute w-4 h-4 inset-inline-start-0 top-0 m-0 opacity-0"
      />
      <CheckboxIcon
        className={classNames(
          'me-2',
          size === 'small' ? 'w-4 h-4 mobile:w-[18px] mobile:h-[18px]' : 'w-[18px] h-[18px]',
          // Each child glyph hidden by default; reveal per checked/disabled state.
          '[&>*]:hidden',
          '[&>*:nth-child(1)]:text-muted [&>*:nth-child(2)]:text-primary',
          'peer-[:not(:checked):not(:disabled)]:[&>*:nth-child(1)]:block',
          'peer-[:checked:not(:disabled)]:[&>*:nth-child(2)]:block',
          'peer-[:checked:not(:disabled)]:[&>*:nth-child(3)]:block'
        )}
      />
    </div>
  );
};

export default forwardRef<HTMLInputElement, Props>(Checkbox);
