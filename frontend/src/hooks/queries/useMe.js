import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../api/auth.api.js';
import { queryKeys } from '../../api/queryKeys.js';

const SESSION_STALE_MS = 5 * 60 * 1000;

// A 401 is the normal signed-out answer, not a failure.
const fetchSession = async ({ signal }) => {
  try {
    return await getMe({ signal });
  } catch (error) {
    if (error?.status === 401) return null;
    throw error;
  }
};

// The session's source of truth. `data` is the user, or null when signed out.
export const useMe = () =>
  useQuery({ queryKey: queryKeys.me, queryFn: fetchSession, staleTime: SESSION_STALE_MS });
