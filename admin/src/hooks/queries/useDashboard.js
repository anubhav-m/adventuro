import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../api/dashboard.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// The dashboard's figures for an inclusive range of IST days: { from, to } as 'YYYY-MM-DD'.
export const useDashboard = ({ from, to }, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.dashboard({ from, to }),
    queryFn: ({ signal }) => getDashboard({ from, to }, { signal }),
    enabled,
  });
