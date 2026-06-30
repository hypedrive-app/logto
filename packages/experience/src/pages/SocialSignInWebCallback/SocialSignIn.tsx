import LoadingLayer from '@/shared/components/LoadingLayer';

import useSocialSignInListener from './use-social-sign-in-listener';

/**
 * Social sign-in callback page
 */
type Props = {
  readonly connectorId: string;
};

const SocialSignIn = ({ connectorId }: Props) => {
  const { loading } = useSocialSignInListener(connectorId);

  // Render nothing once the listener finishes: a finished callback is NOT an error —
  // the error handlers already navigate away (e.g. to MFA verification) or show a toast.
  // Rendering an ErrorPage here flashes "session not found" behind the (translucent)
  // loading/toast overlay during that transition. Matches upstream.
  return loading ? <LoadingLayer /> : null;
};

export default SocialSignIn;
