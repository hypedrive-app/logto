import ArrowNext from '@experience/shared/assets/icons/arrow-next.svg?react';
import DynamicT from '@experience/shared/components/DynamicT';
import FlipOnRtl from '@experience/shared/components/FlipOnRtl';
import classNames from 'classnames';
import { type TFuncKey } from 'i18next';
import type { ComponentType, SVGProps } from 'react';

import EmailIcon from '@ac/assets/icons/email.svg?react';
import PasswordIcon from '@ac/assets/icons/password.svg?react';
import PhoneIcon from '@ac/assets/icons/phone.svg?react';
import { VerificationMethod } from '@ac/types';

export type Props = {
  readonly method: VerificationMethod;
  readonly onClick?: () => void;
};

type MethodContent = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  nameKey: TFuncKey;
  descriptionKey: TFuncKey;
};

const methodContentMap: Partial<Record<VerificationMethod, MethodContent>> = {
  [VerificationMethod.Password]: {
    icon: PasswordIcon,
    nameKey: 'account_center.verification_method.password.name',
    descriptionKey: 'account_center.verification_method.password.description',
  },
  [VerificationMethod.EmailCode]: {
    icon: EmailIcon,
    nameKey: 'account_center.verification_method.email.name',
    descriptionKey: 'account_center.verification_method.email.description',
  },
  [VerificationMethod.PhoneCode]: {
    icon: PhoneIcon,
    nameKey: 'account_center.verification_method.phone.name',
    descriptionKey: 'account_center.verification_method.phone.description',
  },
};

const VerificationMethodButton = ({ method, onClick }: Props) => {
  const content = methodContentMap[method];

  if (!content) {
    return null;
  }

  const { icon: Icon, nameKey, descriptionKey } = content;

  return (
    <button
      className={classNames(
        // Base ghost/secondary button surface, full width.
        'btn-ghost relative flex flex-row items-center w-full overflow-hidden select-none outline-none appearance-none',
        // VerificationMethodButton overrides on the base button.
        'h-auto py-3 ps-3 pe-4 gap-4 rounded-[11px] border border-[var(--color-line-divider)]'
      )}
      type="button"
      onClick={onClick}
    >
      <Icon className="w-5 h-5 text-muted" />
      <div className="flex-1 flex flex-col items-start text-start">
        <div className="text-base font-medium text-ink desktop:text-sm desktop:font-medium">
          <DynamicT forKey={nameKey} />
        </div>
        <div className="text-sm text-muted">
          <DynamicT forKey={descriptionKey} />
        </div>
      </div>
      <FlipOnRtl>
        <ArrowNext className="w-5 h-5 text-muted" />
      </FlipOnRtl>
    </button>
  );
};

export default VerificationMethodButton;
