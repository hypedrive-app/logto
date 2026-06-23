import classNames from 'classnames';
import type { TFuncKey } from 'i18next';
import type { ReactNode, AnchorHTMLAttributes } from 'react';

import DynamicT from '@/shared/components/DynamicT';

const linkClass =
  'cursor-pointer [-webkit-tap-highlight-color:transparent] inline-flex justify-center ' +
  'transition-[color] duration-200 ease-in-out motion-reduce:transition-none [text-underline-offset:2px] rounded-[11px] ' +
  '[&>svg]:me-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-overlay-brand-focused)] focus-visible:outline-offset-2';

const linkTypeClass = {
  primary:
    'text-sm font-medium text-primary no-underline active:text-[var(--color-brand-hover)] desktop:hover:text-[var(--color-brand-hover)]',
  secondary:
    'text-ink font-[inherit] no-underline desktop:hover:text-primary desktop:active:text-primary',
} as const;

export type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly text?: TFuncKey;
  readonly icon?: ReactNode;
  readonly type?: 'primary' | 'secondary';
};

const TextLink = ({ className, children, text, icon, type = 'primary', ...rest }: Props) => {
  return (
    <a className={classNames(linkClass, linkTypeClass[type], className)} {...rest} rel="noopener">
      {icon}
      {children ?? <DynamicT forKey={text} />}
    </a>
  );
};

export default TextLink;
