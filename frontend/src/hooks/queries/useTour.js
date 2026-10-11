import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { getTour } from '../../api/tours.api.js';

export const useTour = (slug) =>
  useQuery({
    queryKey: queryKeys.tours.detail(slug),
    queryFn: ({ signal }) => getTour(slug, { signal }),
  });
