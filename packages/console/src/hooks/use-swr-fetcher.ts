import { type RequestErrorBody } from '@logto/schemas';
import type ky from 'ky';
import { HTTPError } from 'ky';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Fetcher } from 'swr';

import { RequestError } from './use-api';

type KyInstance = typeof ky;

type WithTotalNumber<T> = Array<Awaited<T> | number | boolean>;

type UseSwrFetcherHook = {
  <T>(api: KyInstance): Fetcher<T>;
  <T extends unknown[]>(api: KyInstance): Fetcher<WithTotalNumber<T>>;
};

const useSwrFetcher: UseSwrFetcherHook = <T>(api: KyInstance) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  const fetcher = useCallback<Fetcher<T | WithTotalNumber<T>>>(
    async (resource: string) => {
      try {
        const response = await api.get(resource);

        const data = await response.json<T>();

        if (typeof resource === 'string' && resource.includes('?')) {
          const parameters = new URLSearchParams(resource.split('?')[1]);

          if (parameters.get('page') && parameters.get('page_size')) {
            const number = response.headers.get('Total-Number');

            if (!number) {
              throw new Error(t('errors.missing_total_number'));
            }

            // Optional 3rd element signals that the server short-circuited the
            // count query at a cap (see `Total-Number-Is-Capped` on /api/logs).
            // Consumers that don't care keep destructuring [data, total].
            const isCapped = response.headers.get('Total-Number-Is-Capped') === 'true';
            return [data, Number(number), isCapped];
          }
        }

        return data;
      } catch (error: unknown) {
        if (error instanceof HTTPError) {
          // Ky v2 pre-parses the response body into `error.data` before this runs and, in
          // doing so, consumes the stream — so `error.response.json()`/`.clone().json()`
          // would throw "Response body is already used" (surfacing as React #130 mid-render).
          // Read the pre-parsed body from `error.data` instead.
          // eslint-disable-next-line no-restricted-syntax
          const body = error.data as RequestErrorBody | undefined;
          throw new RequestError(error.response.status, body);
        }
        throw error;
      }
    },
    [api, t]
  );

  return fetcher;
};

export default useSwrFetcher;
