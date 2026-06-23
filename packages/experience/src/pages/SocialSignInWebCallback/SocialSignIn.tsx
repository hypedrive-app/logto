import ErrorPage from '@/pages/ErrorPage';
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

  return loading ? <LoadingLayer /> : <ErrorPage title="error.invalid_session" />;
};

export default SocialSignIn;
