import { useLogto } from '@logto/react';
import type { JsonObject, RequestErrorBody, UserProfileResponse } from '@logto/schemas';
import { HTTPError } from 'ky';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import useAccountApi from './use-account-api';
import { RequestError } from './use-api';
import useRedirectUri from './use-redirect-uri';
import useSignOut from './use-sign-out';

const useCurrentUser = () => {
  const { isAuthenticated } = useLogto();
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { signOut } = useSignOut();
  const postSignOutRedirectUri = useRedirectUri('signOut');

  const accountApi = useAccountApi();
  const accountApiFetcher = useCallback(async () => {
    try {
      return await accountApi.get('').json<UserProfileResponse>();
    } catch (error: unknown) {
      if (error instanceof HTTPError) {
        // Ky v2 already parsed the body into `error.data` (consuming the stream), so
        // `response.json()` would throw "Response body is already used". Use `error.data`.
        // eslint-disable-next-line no-restricted-syntax
        const data = error.data as RequestErrorBody | undefined;

        if (error.response.status === 401 && data?.code === 'auth.unauthorized') {
          await signOut(postSignOutRedirectUri.href);
        } else {
          throw new RequestError(error.response.status, data);
        }
      }

      throw error;
    }
  }, [accountApi, postSignOutRedirectUri.href, signOut]);

  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<UserProfileResponse, RequestError>(isAuthenticated && 'me', accountApiFetcher);

  const updateCustomData = useCallback(
    async (customData: JsonObject) => {
      if (!user) {
        toast.error(t('errors.unexpected_error'));
        return;
      }

      try {
        // Account API uses 'replace' mode, so we need to merge with existing customData
        const mergedCustomData = { ...user.customData, ...customData };
        const data = await accountApi
          .patch('', { json: { customData: mergedCustomData } })
          .json<UserProfileResponse>();
        await mutate({ ...user, customData: data.customData });
      } catch (error: unknown) {
        // TODO: Move shared Account API error handling into `useAccountApi()` once we define
        // how callers opt into the right UX (for example toast versus modal feedback).
        if (error instanceof HTTPError) {
          // Ky v2 pre-parses the body into `error.data`; reading the stream again would
          // throw "Response body is already used".
          // eslint-disable-next-line no-restricted-syntax
          const data = error.data as RequestErrorBody | undefined;

          if (data) {
            toast.error(
              [data.message, data.details].join('\n') || t('errors.unknown_server_error')
            );
          } else {
            toast.error(t('errors.unknown_server_error'));
          }

          return;
        }

        throw error;
      }
    },
    [accountApi, mutate, t, user]
  );

  return {
    user,
    isLoading,
    error,
    isLoaded: !isLoading && !error,
    reload: mutate,
    customData: user?.customData,
    /** Patch (shallow merge) the custom data of the current user. */
    updateCustomData,
  };
};

export default useCurrentUser;
