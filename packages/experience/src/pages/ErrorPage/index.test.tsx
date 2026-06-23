import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

import ErrorPage from '.';

describe('ErrorPage Page', () => {
  it('render properly', () => {
    const { queryByText } = render(
      <HelmetProvider>
        <MemoryRouter>
          <ErrorPage title="description.not_found" message="error.invalid_email" />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(queryByText('description.not_found')).not.toBeNull();
    expect(queryByText('error.invalid_email')).not.toBeNull();
  });
});
