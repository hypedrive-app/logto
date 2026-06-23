import classNames from 'classnames';

import Checkbox, { type Props as CheckboxProps } from '@/components/Checkbox';
import { onKeyDownHandler } from '@/shared/utils/a11y';

type Props = Omit<CheckboxProps, 'onChange'> & {
  readonly onChange: (checked: boolean) => void;
};

const CheckboxField = ({ className, checked, title, onChange, ...rest }: Props) => {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      className={classNames(
        'flex items-center cursor-pointer [&_input[type=checkbox]]:cursor-pointer',
        className
      )}
      onClick={() => {
        onChange(!checked);
      }}
      onKeyDown={onKeyDownHandler({
        Escape: () => {
          onChange(false);
        },
        Enter: () => {
          onChange(!checked);
        },
        ' ': () => {
          onChange(!checked);
        },
      })}
    >
      <Checkbox {...rest} checked={checked} />
      <span>{title}</span>
    </div>
  );
};

export default CheckboxField;
