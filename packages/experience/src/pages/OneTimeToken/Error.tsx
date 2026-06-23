import type { TFuncKey } from 'i18next';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';

import ErrorPage from '@/pages/ErrorPage';

// Runtime guard for i18n key strings while preserving TFuncKey typing at compile-time
const tFunctionKey = z.custom<TFuncKey>((value) => typeof value === 'string');
const stateGuard = z.object({
  title: tFunctionKey.optional(),
  message: tFunctionKey.optional(),
  errorMessage: z.string().optional(),
});

const Error = () => {
  const { state } = useLocation();
  const { data: parsed } = stateGuard.safeParse(state);

  return (
    <ErrorPage
      isNavbarHidden
      title={parsed?.title ?? 'error.invalid_link'}
      message={parsed?.message ?? 'error.invalid_link_description'}
      rawMessage={parsed?.errorMessage}
    />
  );
};

export default Error;
