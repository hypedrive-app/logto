import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Queries, queries, RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

import PageContextProvider from '@/Providers/PageContextProvider';

const renderWithPageContext = <
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
>(
  ui: ReactElement,
  memoryRouterProps: Parameters<typeof MemoryRouter>[0] = {},
  options: RenderOptions<Q, Container> = {}
) => {
  // Fresh client per render so tests never share cache, and retries are off so a
  // failing query surfaces its error synchronously instead of retrying.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render<Q, Container>(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...memoryRouterProps}>
          <PageContextProvider>{ui}</PageContextProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
    options
  );
};

export default renderWithPageContext;
