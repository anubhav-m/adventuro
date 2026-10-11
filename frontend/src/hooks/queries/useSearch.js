import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { search } from '../../api/search.api.js';
import { LIMITS } from '../../lib/constants.js';

// Resolves to { tours, gear }. Nothing is asked until the term is long enough for the API.
export const useSearch = (q) =>
  useQuery({
    queryKey: queryKeys.search(q),
    queryFn: ({ signal }) => search(q, { signal }),
    enabled: q.length >= LIMITS.SEARCH_MIN,
  });
