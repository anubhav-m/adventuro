import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { getVertical } from '../../api/verticals.api.js';
import { CATALOG_STALE_MS } from '../../lib/queryClient.js';

// Resolves to { vertical, tours }.
export const useVertical = (key) =>
  useQuery({
    queryKey: queryKeys.verticals.detail(key),
    queryFn: ({ signal }) => getVertical(key, { signal }),
    staleTime: CATALOG_STALE_MS,
  });
