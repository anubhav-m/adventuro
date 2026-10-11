import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Tests add their own handlers with server.use(). An unhandled request fails the test.
export const server = setupServer();

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
