import type { ExperienceSocialConnector } from '@logto/schemas';
import classNames from 'classnames';
import { useState } from 'react';

import SocialLinkButton from '@/components/Button/SocialLinkButton';
import useNativeMessageListener from '@/hooks/use-native-message-listener';
import { getLogoUrl } from '@/shared/utils/logo';

import useSocial from './use-social';

type Props = {
  readonly className?: string;
  readonly socialConnectors?: ExperienceSocialConnector[];
};

const SocialSignInList = ({ className, socialConnectors = [] }: Props) => {
  const { invokeSocialSignIn, theme } = useSocial();
  useNativeMessageListener();

  const [loadingConnectorId, setLoadingConnectorId] = useState<string>();

  const handleClick = async (connector: ExperienceSocialConnector) => {
    setLoadingConnectorId(connector.id);
    await invokeSocialSignIn(connector);
    setLoadingConnectorId(undefined);
  };

  return (
    <div
      className={classNames(
        'flex flex-col items-stretch justify-center w-full',
        // Tasteful staggered entrance for the social provider stack (presentation only):
        // each button fades up slightly later than the previous for a gentle cascade.
        '[&>*]:animate-[social-fade-in_0.32s_ease_both] motion-reduce:[&>*]:animate-none',
        '[&>*:nth-child(2)]:[animation-delay:0.05s] [&>*:nth-child(3)]:[animation-delay:0.1s]',
        '[&>*:nth-child(4)]:[animation-delay:0.15s] [&>*:nth-child(5)]:[animation-delay:0.2s]',
        '[&>*:nth-child(6)]:[animation-delay:0.25s] [&>*:nth-child(n+7)]:[animation-delay:0.3s]',
        className
      )}
    >
      {socialConnectors.map((connector) => {
        const { id, name, logo: logoUrl, logoDark: darkLogoUrl, target } = connector;

        return (
          <SocialLinkButton
            key={id}
            className="mb-2.5 last:mb-0"
            name={name}
            logo={getLogoUrl({ theme, logoUrl, darkLogoUrl })}
            target={target}
            isLoading={loadingConnectorId === id}
            onClick={() => {
              void handleClick(connector);
            }}
          />
        );
      })}
    </div>
  );
};

export default SocialSignInList;
