import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys.js';

const LIST_STALE_MS = 60 * 1000;
const MAX_RETRIES = 2;

// Only failures that can go away on their own are retried: no connection, or a server fault.
const shouldRetry = (failureCount, error) =>
  failureCount < MAX_RETRIES && Boolean(error?.isNetworkError || error?.status >= 500);

export const createQueryClient = () => {
  // A session can end, or lose its admin role, between two requests. An expired one signs the
  // UI out; a refused one re-reads the session, and the route guard acts on what comes back.
  const followSessionErrors = (error) => {
    if (error?.code === 'UNAUTHENTICATED') queryClient.setQueryData(queryKeys.me, null);
    if (error?.code === 'FORBIDDEN') queryClient.invalidateQueries({ queryKey: queryKeys.me });
  };
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: followSessionErrors }),
    mutationCache: new MutationCache({ onError: followSessionErrors }),
    defaultOptions: {
      queries: { staleTime: LIST_STALE_MS, retry: shouldRetry, refetchOnWindowFocus: false },
    },
  });
  return queryClient;
};
