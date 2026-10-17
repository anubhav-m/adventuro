import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { getVertical, listVerticals } from '../../api/verticals.api.js';

// The six verticals, in their order. They never change shape, so they are fetched once.
export const useVerticals = () =>
  useQuery({
    queryKey: queryKeys.verticals.all,
    queryFn: ({ signal }) => listVerticals({ signal }),
    staleTime: Infinity,
  });

export const useVertical = (id) =>
  useQuery({
    queryKey: queryKeys.verticals.detail(id),
    queryFn: ({ signal }) => getVertical(id, { signal }),
  });
