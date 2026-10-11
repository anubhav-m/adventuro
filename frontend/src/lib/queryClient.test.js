import { describe, expect, it } from 'vitest';
import { ApiError, NETWORK_ERROR } from '../api/ApiError.js';
import { createQueryClient } from './queryClient.js';

describe('createQueryClient', () => {
  const { queries } = createQueryClient().getDefaultOptions();

  it('keeps data fresh for a minute and does not refetch on window focus', () => {
    expect(queries.staleTime).toBe(60_000);
    expect(queries.refetchOnWindowFocus).toBe(false);
  });

  it('retries a network failure or a server fault, at most twice', () => {
    const offline = new ApiError({ code: NETWORK_ERROR });
    const fault = new ApiError({ status: 503 });

    expect(queries.retry(0, offline)).toBe(true);
    expect(queries.retry(1, fault)).toBe(true);
    expect(queries.retry(2, fault)).toBe(false);
  });

  it('never retries an answer that will not change: 4xx or an unexpected error', () => {
    expect(queries.retry(0, new ApiError({ status: 404, code: 'NOT_FOUND' }))).toBe(false);
    expect(queries.retry(0, new ApiError({ status: 401, code: 'UNAUTHENTICATED' }))).toBe(false);
    expect(queries.retry(0, new Error('boom'))).toBe(false);
    expect(queries.retry(0, null)).toBe(false);
  });
});
