import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Matches the API on any origin: http.get(api('/tours'), …)
export const api = (path) => `*/api/v1${path}`;

// The real envelope shapes from /CLAUDE.md.
export const success = (data, { meta, status = 200, message = 'OK' } = {}) =>
  HttpResponse.json(
    { success: true, message, ...(data && { data }), ...(meta && { meta }) },
    { status },
  );

export const failure = (status, code, { errors, message = 'Raw server message' } = {}) =>
  HttpResponse.json({ success: false, message, code, ...(errors && { errors }) }, { status });

// Every test starts signed out. Tests add their own handlers with server.use(); any other
// unhandled request fails the test.
export const server = setupServer(http.get(api('/auth/me'), () => failure(401, 'UNAUTHENTICATED')));

export const signedInAs = (user) => server.use(http.get(api('/auth/me'), () => success({ user })));

// Records the JSON bodies a mutation endpoint receives, answering each with `resolver(body)`.
export const record = (method, path, resolver) => {
  const received = [];
  server.use(
    http[method](api(path), async ({ request }) => {
      const body = await request.json().catch(() => null);
      received.push(body);
      return resolver(body);
    }),
  );
  return received;
};
