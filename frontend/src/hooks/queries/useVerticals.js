import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { listVerticals } from '../../api/verticals.api.js';
import { CATALOG_STALE_MS } from '../../lib/queryClient.js';

export const useVerticals = () =>
  useQuery({
    queryKey: queryKeys.verticals.all,
    queryFn: ({ signal }) => listVerticals({ signal }),
    staleTime: CATALOG_STALE_MS,
  });
