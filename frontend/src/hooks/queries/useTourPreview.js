import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';

// A tour as its card knows it, with its vertical, when the visitor has already loaded the
// vertical that lists it: enough for the tour page's hero. It never fetches.
export const useTourPreview = (slug) => {
  const queryClient = useQueryClient();
  for (const [, data] of queryClient.getQueriesData({ queryKey: queryKeys.verticals.all })) {
    const card = data?.tours?.find((tour) => tour.slug === slug);
    if (card) return { ...card, vertical: data.vertical };
  }
  return undefined;
};
