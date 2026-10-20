import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listSubscribers } from '../../api/newsletter.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// One page of newsletter subscribers. The page on screen stays while the next one loads.
export const useSubscribers = (params) =>
  useQuery({
    queryKey: queryKeys.newsletter.list(params),
    queryFn: ({ signal }) => listSubscribers(params, { signal }),
    placeholderData: keepPreviousData,
  });
