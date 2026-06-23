import classNames from 'classnames';

type Props = {
  readonly isChecked: boolean;
  readonly isDisabled?: boolean;
  readonly ariaLabel?: string;
  readonly onChange: (checked: boolean) => void;
};

const ToggleSwitch = ({ isChecked, isDisabled, ariaLabel, onChange }: Props) => {
  return (
    <label
      className={classNames(
        'relative inline-block w-11 h-6 flex-shrink-0',
        isDisabled && '[&_span]:cursor-not-allowed [&_span]:opacity-60'
      )}
    >
      <input
        aria-label={ariaLabel ?? 'Toggle switch'}
        type="checkbox"
        checked={isChecked}
        disabled={isDisabled}
        className="peer opacity-0 w-0 h-0"
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      <span
        className={classNames(
          'absolute cursor-pointer inset-0 bg-surface-2 rounded-full transition-[background-color,transform] duration-300',
          'before:absolute before:content-[""] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:duration-300 before:shadow-[var(--sh-xs)]',
          'peer-checked:bg-success peer-checked:before:translate-x-5',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2'
        )}
      />
    </label>
  );
};

export default ToggleSwitch;
