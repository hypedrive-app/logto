import { formUrlEncodedHeaders } from '@logto/shared';
import { appendPath } from '@silverhand/essentials';
import ky from 'ky';

import { logtoConsoleUrl, logtoUrl, logtoCloudUrl } from '#src/constants.js';

const api = ky.extend({
  prefix: appendPath(new URL(logtoUrl), 'api'),
});

export default api;

export const baseApi = ky.extend({
  prefix: new URL(logtoUrl),
});

// TODO: @gao rename
export const authedAdminApi = api.extend({
  headers: {
    'development-user-id': 'integration-test-admin-user',
  },
});

export const adminTenantApi = ky.extend({
  prefix: appendPath(new URL(logtoConsoleUrl), 'api'),
});

export const authedAdminTenantApi = adminTenantApi.extend({
  headers: {
    'development-user-id': 'integration-test-admin-user',
  },
});

export const cloudApi = ky.extend({
  prefix: appendPath(new URL(logtoCloudUrl), 'api'),
});

export const oidcApi = ky.extend({
  headers: formUrlEncodedHeaders,
  prefix: appendPath(new URL(logtoUrl), 'oidc'),
});
