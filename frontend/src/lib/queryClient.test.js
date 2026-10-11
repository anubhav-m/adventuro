import { describe, expect, it } from 'vitest';
import { ApiError, NETWORK_ERROR } from '../api/ApiError.js';
import { queryKeys } from '../api/queryKeys.js';
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

describe('an expired session', () => {
  const USER = { id: 'user-1', name: 'Asha' };
  const unauthenticated = new ApiError({ status: 401, code: 'UNAUTHENTICATED' });

  const signedInClient = () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.me, USER);
    return queryClient;
  };

  it('signs the UI out when any query answers UNAUTHENTICATED', async () => {
    const queryClient = signedInClient();
    await queryClient
      .fetchQuery({
        queryKey: ['bookings', 'mine'],
        queryFn: () => Promise.reject(unauthenticated),
      })
      .catch(() => {});

    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
  });

  it('signs the UI out when a mutation answers UNAUTHENTICATED', async () => {
    const queryClient = signedInClient();
    await queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: () => Promise.reject(unauthenticated) })
      .execute()
      .catch(() => {});

    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
  });

  it.each([
    ['a forbidden answer', new ApiError({ status: 403, code: 'FORBIDDEN' })],
    ['a server fault', new ApiError({ status: 500, code: 'INTERNAL_ERROR' })],
    ['a network failure', new ApiError({ code: NETWORK_ERROR })],
    ['an unexpected error', new Error('boom')],
  ])('keeps the session on %s', async (_label, error) => {
    const queryClient = signedInClient();
    await queryClient
      .fetchQuery({ queryKey: ['tours'], queryFn: () => Promise.reject(error), retry: false })
      .catch(() => {});

    expect(queryClient.getQueryData(queryKeys.me)).toEqual(USER);
  });
});
