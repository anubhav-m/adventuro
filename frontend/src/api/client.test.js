import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { api, failure, server, success } from '../test/server.js';
import { ApiError } from './ApiError.js';
import { request, requestBlob } from './client.js';

const caught = async (promise) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the request to fail');
};

describe('request', () => {
  it('unwraps the envelope to its data', async () => {
    server.use(http.get(api('/tours/goa'), () => success({ tour: { slug: 'goa' } })));
    await expect(request('/tours/goa')).resolves.toEqual({ tour: { slug: 'goa' } });
  });

  it('keeps meta beside the data of a paginated response', async () => {
    const meta = { page: 2, limit: 12, total: 30, totalPages: 3 };
    server.use(http.get(api('/tours'), () => success({ tours: [] }, { meta })));
    await expect(request('/tours')).resolves.toEqual({ tours: [], meta });
  });

  it('resolves to an empty object when a success has no data', async () => {
    server.use(http.post(api('/auth/logout'), () => success()));
    await expect(request('/auth/logout', { method: 'POST' })).resolves.toEqual({});
  });

  it('sends the session cookie, and query params without the empty ones', async () => {
    server.use(http.get(api('/gear'), () => success({ gear: [] })));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await request('/gear', {
      params: { q: 'dry bag', page: 2, category: '', climate: undefined, tag: null },
    });
    const [url, init] = fetchSpy.mock.calls[0];
    fetchSpy.mockRestore();

    expect(init.credentials).toBe('include');
    expect(url.pathname).toBe('/api/v1/gear');
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'dry bag', page: '2' });
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('sends a body as JSON', async () => {
    let seen;
    server.use(
      http.post(api('/newsletter'), async ({ request: received }) => {
        seen = { type: received.headers.get('content-type'), body: await received.json() };
        return success();
      }),
    );
    await request('/newsletter', { method: 'POST', body: { email: 'a@b.co' } });
    expect(seen).toEqual({ type: 'application/json', body: { email: 'a@b.co' } });
  });

  it('throws an ApiError with status, code and the rejected fields', async () => {
    server.use(
      http.patch(api('/users/me'), () =>
        failure(400, 'VALIDATION_ERROR', {
          errors: [{ field: 'phone', message: 'Invalid phone number' }],
        }),
      ),
    );
    const error = await caught(request('/users/me', { method: 'PATCH', body: { phone: '1' } }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', isNetworkError: false });
    expect(error.fieldErrors).toEqual([{ field: 'phone' }]);
  });

  it('never carries the server message', async () => {
    server.use(http.get(api('/auth/me'), () => failure(401, 'UNAUTHENTICATED')));
    const error = await caught(request('/auth/me'));

    expect(error.fieldErrors).toEqual([]);
    expect(JSON.stringify({ ...error, message: error.message })).not.toContain('Raw server');
  });

  it('reports a network failure', async () => {
    server.use(http.get(api('/verticals'), () => HttpResponse.error()));
    const error = await caught(request('/verticals'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, isNetworkError: true });
  });

  it('handles an error response that is not JSON', async () => {
    server.use(
      http.get(api('/verticals'), () => new HttpResponse('<h1>Bad gateway</h1>', { status: 502 })),
    );
    await expect(caught(request('/verticals'))).resolves.toMatchObject({
      status: 502,
      code: null,
    });
  });

  it('rejects a 200 that is not a success envelope', async () => {
    server.use(http.get(api('/verticals'), () => HttpResponse.json({ verticals: [] })));
    await expect(caught(request('/verticals'))).resolves.toBeInstanceOf(ApiError);
  });

  it('lets a cancelled request reject as an abort, not as a network failure', async () => {
    server.use(http.get(api('/search'), () => success({ tours: [], gear: [] })));
    const controller = new AbortController();
    controller.abort();
    const error = await caught(request('/search', { signal: controller.signal }));

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error.name).toBe('AbortError');
  });
});

describe('requestBlob', () => {
  it('resolves to the file', async () => {
    server.use(
      http.get(
        api('/bookings/ADV-TT-2026-000001/ticket'),
        () => new HttpResponse('%PDF-1.7', { headers: { 'Content-Type': 'application/pdf' } }),
      ),
    );
    const blob = await requestBlob('/bookings/ADV-TT-2026-000001/ticket');
    await expect(blob.text()).resolves.toBe('%PDF-1.7');
  });

  it('throws an ApiError from the JSON envelope of a failure', async () => {
    server.use(
      http.get(api('/bookings/ADV-TT-2026-000009/ticket'), () => failure(404, 'NOT_FOUND')),
    );
    await expect(caught(requestBlob('/bookings/ADV-TT-2026-000009/ticket'))).resolves.toMatchObject(
      { status: 404, code: 'NOT_FOUND' },
    );
  });
});
