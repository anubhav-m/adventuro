import { QueryClient } from '@tanstack/react-query';

const LIST_STALE_MS = 60 * 1000;
const MAX_RETRIES = 2;

// Only failures that can go away on their own are retried: no connection, or a server fault.
const shouldRetry = (failureCount, error) =>
  failureCount < MAX_RETRIES && Boolean(error?.isNetworkError || error?.status >= 500);

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: LIST_STALE_MS, retry: shouldRetry, refetchOnWindowFocus: false },
    },
  });
