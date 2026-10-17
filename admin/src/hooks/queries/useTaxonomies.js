import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { listTaxonomies } from '../../api/taxonomies.api.js';

// One type's list ('category', 'climate' or 'tag'), sorted by the server.
export const useTaxonomies = (type) =>
  useQuery({
    queryKey: queryKeys.taxonomies.list(type),
    queryFn: ({ signal }) => listTaxonomies(type, { signal }),
  });
