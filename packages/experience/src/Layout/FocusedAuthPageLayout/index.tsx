import { type AgreeToTermsPolicy } from '@logto/schemas';
import { type TFuncKey } from 'i18next';
import { useMemo, type ReactNode } from 'react';

import type { Props as TextLinkProps } from '@/components/TextLink';
import TextLink from '@/components/TextLink';
import TermsAndPrivacyLinks from '@/containers/TermsAndPrivacyLinks';
import useTerms from '@/hooks/use-terms';
import DynamicT from '@/shared/components/DynamicT';
import type { Props as PageMetaProps } from '@/shared/components/PageMeta';

import FirstScreenLayout from '../FirstScreenLayout';

type Props = {
  readonly children: ReactNode;
  readonly pageMeta: PageMetaProps;
  readonly title: TFuncKey;
  readonly description: string;
  readonly footerTermsDisplayPolicies?: AgreeToTermsPolicy[];
  readonly authOptionsLink: TextLinkProps;
};

/**
 * FocusedAuthPageLayout Component
 *
 * This layout component is designed for focused authentication pages that serve as the first screen
 * for specific auth methods, such as identifier sign-in, identifier-register, and single sign-on landing pages.
 */
const FocusedAuthPageLayout = ({
  children,
  pageMeta,
  title,
  description,
  footerTermsDisplayPolicies = [],
  authOptionsLink,
}: Props) => {
  const { agreeToTermsPolicy } = useTerms();

  const shouldDisplayFooterTerms = useMemo(
    () => agreeToTermsPolicy && footerTermsDisplayPolicies.includes(agreeToTermsPolicy),
    [agreeToTermsPolicy, footerTermsDisplayPolicies]
  );

  return (
    <FirstScreenLayout pageMeta={pageMeta}>
      <div className="mt-6 mb-7">
        <div className="-tracking-[0.01em] text-ink mobile:text-[28px]/[36px] mobile:font-semibold desktop:text-2xl desktop:font-semibold">
          <DynamicT forKey={title} />
        </div>
        <div className="mt-2 text-sm text-muted">{description}</div>
      </div>
      {children}
      {shouldDisplayFooterTerms && (
        <TermsAndPrivacyLinks className="mt-4 text-center text-xs text-muted" />
      )}
      <TextLink {...authOptionsLink} className="mt-7" />
    </FirstScreenLayout>
  );
};

export default FocusedAuthPageLayout;
