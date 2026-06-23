import ky from 'ky';

export const createAuthenticatedKy = (accessToken: string) =>
  ky.create({
    hooks: {
      // ky v2: hooks receive a single state object.
      beforeRequest: [
        ({ request }) => {
          request.headers.set('Authorization', `Bearer ${accessToken}`);
        },
      ],
    },
  });
