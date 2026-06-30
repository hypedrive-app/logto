import { experience } from '@logto/schemas';
import type { TFuncKey } from 'i18next';
import { type To } from 'react-router-dom';

import StaticPageLayout from '@/Layout/StaticPageLayout';
import ErrorScene from '@/components/illustrations/ErrorScene';
import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import Button from '@/shared/components/Button';
import DynamicT from '@/shared/components/DynamicT';
import NavBar from '@/shared/components/NavBar';
import PageMeta from '@/shared/components/PageMeta';

import SupportInfo from './SupportInfo';

type PrimaryAction = {
  readonly title: TFuncKey;
  readonly to?: To;
  readonly replace?: boolean;
  readonly onClick?: () => void;
};

type Props = {
  readonly title?: TFuncKey;
  readonly message?: TFuncKey;
  readonly rawMessage?: string;
  readonly isNavbarHidden?: boolean;
  readonly primaryAction?: PrimaryAction;
};

const ErrorPage = ({
  title = 'description.not_found',
  message,
  rawMessage,
  isNavbarHidden,
  primaryAction,
}: Props) => {
  const navigate = useNavigateWithPreservedSearchParams();
  const errorMessage = Boolean(rawMessage ?? message);
  const canGoBack = history.length > 1;

  // Always offer a back-to-sign-in escape when no explicit action is given. Even
  // with history to go back to, the Back arrow can land the user right back on the
  // route that errored (a loop), so a clear forward escape is always shown.
  const resolvedAction: PrimaryAction = primaryAction ?? {
    title: 'description.back_to_sign_in',
    to: `/${experience.routes.signIn}`,
    replace: true,
  };

  return (
    <StaticPageLayout>
      <PageMeta titleKey={title} />
      {canGoBack && (
        <NavBar
          isHidden={isNavbarHidden}
          onBack={() => {
            navigate(-1);
          }}
        />
      )}
      <div className="flex flex-1 flex-col items-center justify-center w-full mx-auto max-w-[var(--max-w)] animate-[content-enter_0.35s_var(--ease-out)_both] motion-reduce:animate-none">
        <ErrorScene />
        <div className="mt-8 text-center text-ink text-balance mobile:text-[28px]/[34px] mobile:mb-4 desktop:text-2xl desktop:mb-2 [font-weight:650]">
          <DynamicT forKey={title} />
        </div>
        {errorMessage && (
          <div className="text-sm text-ink-2 text-center whitespace-pre-wrap">
            {rawMessage ?? <DynamicT forKey={message} />}
          </div>
        )}
        <SupportInfo />
        <Button
          className="w-full mx-auto max-w-[var(--max-w)] mt-4 mobile:mb-4 desktop:mb-6"
          title={resolvedAction.title}
          onClick={() => {
            if (resolvedAction.onClick) {
              resolvedAction.onClick();
              return;
            }

            if (resolvedAction.to) {
              navigate(resolvedAction.to, { replace: resolvedAction.replace });
            }
          }}
        />
      </div>
    </StaticPageLayout>
  );
};

export default ErrorPage;
