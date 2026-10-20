import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { collectPages } from '../../api/collectPages.js';
import { queryKeys } from '../../api/queryKeys.js';
import { getTour, listTours } from '../../api/tours.api.js';

// One page of the tours list. The page on screen stays while the next one loads.
export const useTours = (params) =>
  useQuery({
    queryKey: queryKeys.tours.list(params),
    queryFn: ({ signal }) => listTours(params, { signal }),
    placeholderData: keepPreviousData,
  });

export const useTour = (id, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.tours.detail(id),
    queryFn: ({ signal }) => getTour(id, { signal }),
    enabled,
  });

const ALL = Object.freeze({ scope: 'all' });

// Every tour, published or not, for a picker or filter that offers them all.
export const useAllTours = () =>
  useQuery({
    queryKey: queryKeys.tours.list(ALL),
    queryFn: ({ signal }) => collectPages(listTours, 'tours', { signal }),
  });
