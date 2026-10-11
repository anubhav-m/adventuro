import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { getTour } from '../../api/tours.api.js';

const tourQuery = (slug) => ({
  queryKey: queryKeys.tours.detail(slug),
  queryFn: ({ signal }) => getTour(slug, { signal }),
});

export const useTour = (slug) => useQuery(tourQuery(slug));

// `prefetch(slug)` loads a tour ahead of the click that opens it. A fresh one is left alone.
export const usePrefetchTour = () => {
  const queryClient = useQueryClient();
  return (slug) => queryClient.prefetchQuery(tourQuery(slug));
};
