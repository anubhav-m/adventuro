import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getGear, listGear } from '../../api/gear.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// One page of the gear list. The page on screen stays while the next one loads.
export const useGearList = (params, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.gear.list(params),
    queryFn: ({ signal }) => listGear(params, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useGear = (id, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.gear.detail(id),
    queryFn: ({ signal }) => getGear(id, { signal }),
    enabled,
  });
