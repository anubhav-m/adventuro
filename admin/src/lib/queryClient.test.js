import { describe, expect, it, vi } from 'vitest';
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

describe('a session that ends mid-way', () => {
  const USER = { id: 'user-1', name: 'Aditya', role: 'admin' };
  const unauthenticated = new ApiError({ status: 401, code: 'UNAUTHENTICATED' });
  const forbidden = new ApiError({ status: 403, code: 'FORBIDDEN' });

  const signedInClient = () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.me, USER);
    return queryClient;
  };

  const failQuery = (queryClient, error) =>
    queryClient
      .fetchQuery({ queryKey: ['bookings'], queryFn: () => Promise.reject(error), retry: false })
      .catch(() => {});

  const failMutation = (queryClient, error) =>
    queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: () => Promise.reject(error) })
      .execute()
      .catch(() => {});

  it.each([
    ['query', failQuery],
    ['mutation', failMutation],
  ])('signs the UI out when a %s answers UNAUTHENTICATED', async (_kind, fail) => {
    const queryClient = signedInClient();
    await fail(queryClient, unauthenticated);

    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
  });

  it.each([
    ['query', failQuery],
    ['mutation', failMutation],
  ])('re-reads the session when a %s answers FORBIDDEN', async (_kind, fail) => {
    const queryClient = signedInClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await fail(queryClient, forbidden);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.me });
    expect(queryClient.getQueryData(queryKeys.me)).toEqual(USER);
  });

  it.each([
    ['a server fault', new ApiError({ status: 500, code: 'INTERNAL_ERROR' })],
    ['a network failure', new ApiError({ code: NETWORK_ERROR })],
    ['an unexpected error', new Error('boom')],
  ])('leaves the session alone on %s', async (_label, error) => {
    const queryClient = signedInClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await failQuery(queryClient, error);

    expect(queryClient.getQueryData(queryKeys.me)).toEqual(USER);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
