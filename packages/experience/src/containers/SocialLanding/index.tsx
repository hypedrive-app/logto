import classNames from 'classnames';

import useConnectors from '@/hooks/use-connectors';
import { LoadingIcon } from '@/shared/components/LoadingLayer';

type Props = {
  readonly className?: string;
  readonly connectorId: string;
  readonly isLoading?: boolean;
};

const SocialLanding = ({ className, connectorId, isLoading = false }: Props) => {
  const { findConnectorById, getConnectorLogo } = useConnectors();
  const result = findConnectorById(connectorId);

  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center w-full mx-auto max-w-[var(--max-w)]',
        className
      )}
    >
      <div className="mb-4 [&>img]:w-24 [&>img]:h-24 [&>img]:object-contain [&>img]:object-center">
        {result ? <img src={getConnectorLogo(result)} alt="logo" /> : connectorId}
      </div>
      {isLoading && <LoadingIcon />}
    </div>
  );
};

export default SocialLanding;
