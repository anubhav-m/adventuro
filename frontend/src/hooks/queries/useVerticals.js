import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { listVerticals } from '../../api/verticals.api.js';
import { CATALOG_STALE_MS } from '../../lib/queryClient.js';

// With `enabled: false` nothing is fetched, and the list is whatever the cache already holds.
export const useVerticals = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.verticals.all,
    queryFn: ({ signal }) => listVerticals({ signal }),
    staleTime: CATALOG_STALE_MS,
    enabled,
  });
