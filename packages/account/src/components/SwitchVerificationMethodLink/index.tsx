import SwitchIcon from '@experience/shared/assets/icons/switch-icon.svg?react';
import DynamicT from '@experience/shared/components/DynamicT';
import classNames from 'classnames';

type Props = {
  readonly onClick?: () => void;
  readonly className?: string;
};

const SwitchVerificationMethodLink = ({ onClick, className }: Props) => {
  return (
    <button
      type="button"
      className={classNames(
        'inline-flex items-center gap-2 p-0 m-0 border-none bg-transparent cursor-pointer text-primary text-sm font-medium no-underline [-webkit-tap-highlight-color:transparent] [&>svg]:flex-shrink-0 desktop:hover:text-primary desktop:focus-visible:outline desktop:focus-visible:outline-1 desktop:focus-visible:outline-primary',
        className
      )}
      onClick={() => {
        onClick?.();
      }}
    >
      <SwitchIcon />
      <DynamicT forKey="account_center.verification.try_another_method" />
    </button>
  );
};

export default SwitchVerificationMethodLink;
