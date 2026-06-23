import { ChevronRightIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { type TFuncKey } from 'i18next';
import { type ComponentType, type SVGProps } from 'react';

import DynamicT from '@/shared/components/DynamicT';
import FlipOnRtl from '@/shared/components/FlipOnRtl';

type Props = {
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly titleKey: TFuncKey;
  readonly descriptionKey: TFuncKey;
  readonly descriptionProps?: Record<string, unknown>;
  readonly onClick: () => void;
};

const VerificationMethodCard = ({
  Icon,
  titleKey,
  descriptionKey,
  descriptionProps,
  onClick,
}: Props) => {
  return (
    <button
      className={classNames(
        'relative flex flex-row items-center justify-center overflow-hidden select-none outline-none appearance-none [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none',
        'btn-ghost w-full',
        'py-3 ps-3 pe-4 h-auto gap-4 rounded-[11px] border-line-strong [&]:transform-none [&]:shadow-none',
        'disabled:cursor-not-allowed disabled:border-none disabled:bg-bg'
      )}
      type="button"
      onClick={onClick}
    >
      <Icon className="w-5 h-5 text-muted" />
      <div className="flex-1 flex flex-col items-start text-start">
        <div className="text-base font-medium text-ink desktop:text-sm">
          <DynamicT forKey={titleKey} />
        </div>
        <div className="text-sm text-muted">
          <DynamicT forKey={descriptionKey} interpolation={descriptionProps} />
        </div>
      </div>
      <FlipOnRtl>
        <ChevronRightIcon className="w-4 h-4 text-faint" />
      </FlipOnRtl>
    </button>
  );
};

export default VerificationMethodCard;
