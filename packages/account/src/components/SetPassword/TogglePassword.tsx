import Checkbox from '@/components/Checkbox';
import { onKeyDownHandler } from '@experience/shared/utils/a11y';
import { useTranslation } from 'react-i18next';

type Props = {
  readonly isChecked?: boolean;
  readonly onChange: (checked: boolean) => void;
};

const TogglePassword = ({ isChecked, onChange }: Props) => {
  const { t } = useTranslation();

  const toggle = () => {
    onChange(!isChecked);
  };

  return (
    <div
      role="radio"
      aria-checked={isChecked}
      tabIndex={0}
      className="flex items-center w-full mb-4 select-none cursor-pointer"
      onClick={toggle}
      onKeyDown={onKeyDownHandler({
        Escape: () => {
          onChange(false);
        },
        Enter: toggle,
        ' ': toggle,
      })}
    >
      <Checkbox name="toggle-password" checked={isChecked} className="me-2 cursor-pointer" />
      <div>{t('action.show_password')}</div>
    </div>
  );
};

export default TogglePassword;
