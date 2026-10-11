import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listGear } from '../../api/gear.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// Resolves to { gear, meta }. While a changed filter loads, the previous list stays on screen.
export const useGearList = (filters) =>
  useQuery({
    queryKey: queryKeys.gear.list(filters),
    queryFn: ({ signal }) => listGear(filters, { signal }),
    placeholderData: keepPreviousData,
  });
