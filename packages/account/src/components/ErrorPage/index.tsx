import ErrorScene from '@experience/components/illustrations/ErrorScene';
import Button from '@experience/shared/components/Button';
import DynamicT from '@experience/shared/components/DynamicT';
import PageMeta from '@experience/shared/components/PageMeta';
import type { TFuncKey } from 'i18next';
import type { AnchorHTMLAttributes } from 'react';
import { useContext } from 'react';
import { Trans } from 'react-i18next';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';

type SupportLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { readonly text: string };

const SupportLink = ({ text, ...rest }: SupportLinkProps) => (
  <a {...rest} className="text-primary no-underline hover:underline">
    {text}
  </a>
);

type Props = {
  readonly titleKey?: TFuncKey;
  readonly messageKey?: TFuncKey;
  readonly rawMessage?: string;
  readonly illustration?: string;
  readonly action?: {
    titleKey: TFuncKey;
    onClick: () => void;
  };
};

const SupportInfo = () => {
  const { experienceSettings } = useContext(PageContext);

  if (!experienceSettings) {
    return null;
  }

  const { supportEmail, supportWebsiteUrl } = experienceSettings;

  if (!supportEmail && !supportWebsiteUrl) {
    return null;
  }

  return (
    <div className="mt-2 grid gap-1 justify-items-center">
      {supportEmail && (
        <div className="text-sm text-muted">
          <Trans
            i18nKey="description.support_email"
            components={{
              link: <SupportLink href={`mailto:${supportEmail}`} text={supportEmail} />,
            }}
          />
        </div>
      )}
      {supportWebsiteUrl && (
        <div className="text-sm text-muted">
          <Trans
            i18nKey="description.support_website"
            components={{
              link: (
                <SupportLink
                  href={supportWebsiteUrl}
                  rel="noopener"
                  target="_blank"
                  text={supportWebsiteUrl}
                />
              ),
            }}
          />
        </div>
      )}
    </div>
  );
};

const ErrorPage = ({
  titleKey = 'description.not_found',
  messageKey,
  rawMessage,
  illustration,
  action,
}: Props) => {
  const message = rawMessage ?? (messageKey ? <DynamicT forKey={messageKey} /> : undefined);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center flex-1">
      <PageMeta titleKey={titleKey} />
      {/* A caller may pass a custom illustration URL; otherwise use the animated ErrorScene. */}
      {illustration ? (
        <div className="w-[194px] max-w-full self-center [&>img]:w-full [&>img]:h-auto">
          <img src={illustration} alt="" role="presentation" />
        </div>
      ) : (
        <ErrorScene />
      )}
      <div className="text-xl font-semibold text-ink">
        <DynamicT forKey={titleKey} />
      </div>
      {message && <div className="text-sm text-muted">{message}</div>}
      {action && (
        <Button className="self-center" title={action.titleKey} onClick={action.onClick} />
      )}
      <SupportInfo />
    </div>
  );
};

export default ErrorPage;
