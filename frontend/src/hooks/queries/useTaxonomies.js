import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { listTaxonomies } from '../../api/taxonomies.api.js';
import { CATALOG_STALE_MS } from '../../lib/queryClient.js';

export const useTaxonomies = (type) =>
  useQuery({
    queryKey: queryKeys.taxonomies.list(type),
    queryFn: ({ signal }) => listTaxonomies(type, { signal }),
    staleTime: CATALOG_STALE_MS,
  });
