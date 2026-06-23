import { type TFuncKey } from 'i18next';
import { type ReactNode } from 'react';

import DynamicT from '@/shared/components/DynamicT';

type Props = {
  readonly title: TFuncKey;
  readonly description: TFuncKey;
  readonly titleProps?: Record<string, unknown>;
  readonly descriptionProps?: Record<string, unknown>;
  readonly children: ReactNode;
};

const SectionLayout = ({ title, description, titleProps, descriptionProps, children }: Props) => {
  return (
    <div>
      <div className="text-base font-semibold -tracking-[0.01em] text-ink">
        <DynamicT forKey={title} interpolation={titleProps} />
      </div>
      <div className="mt-2 text-sm text-muted">
        <DynamicT forKey={description} interpolation={descriptionProps} />
      </div>
      {children}
    </div>
  );
};

export default SectionLayout;
