import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { getTour, listTours } from '../../api/tours.api.js';
import { LIMITS } from '../../lib/constants.js';

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

// Every tour, published or not, page by page, for a picker that searches them all.
const listAllTours = async ({ signal }) => {
  const tours = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page += 1) {
    const result = await listTours({ page, limit: LIMITS.PAGE_LIMIT_MAX }, { signal });
    tours.push(...result.tours);
    totalPages = result.meta.totalPages;
  }
  return tours;
};

export const useAllTours = () =>
  useQuery({ queryKey: queryKeys.tours.list(ALL), queryFn: listAllTours });
