import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys.js';

const LIST_STALE_MS = 60 * 1000;
// Verticals and taxonomies change only when an admin edits them.
export const CATALOG_STALE_MS = 10 * 60 * 1000;
const MAX_RETRIES = 2;

// Only failures that can go away on their own are retried: no connection, or a server fault.
const shouldRetry = (failureCount, error) =>
  failureCount < MAX_RETRIES && Boolean(error?.isNetworkError || error?.status >= 500);

export const createQueryClient = () => {
  // An expired session can surface on any request. Clearing `me` signs the UI out, and the
  // guards then send protected pages to sign-in.
  const endSessionOnUnauthenticated = (error) => {
    if (error?.code === 'UNAUTHENTICATED') queryClient.setQueryData(queryKeys.me, null);
  };
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: endSessionOnUnauthenticated }),
    mutationCache: new MutationCache({ onError: endSessionOnUnauthenticated }),
    defaultOptions: {
      queries: { staleTime: LIST_STALE_MS, retry: shouldRetry, refetchOnWindowFocus: false },
    },
  });
  return queryClient;
};
