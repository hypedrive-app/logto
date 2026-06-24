import type { ReactNode } from 'react';

type Props = {
  readonly className?: string;
  readonly children?: ReactNode;
};

// Hypedrive self-hosted — no "Cloud" feature badges.
function CloudTag(_props: Props) {
  return null;
}

export default CloudTag;
