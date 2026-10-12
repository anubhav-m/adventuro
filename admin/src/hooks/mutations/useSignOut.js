import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from '../../api/auth.api.js';
import { queryKeys } from '../../api/queryKeys.js';

const [SESSION_KEY] = queryKeys.me;

// Signing out ends the session and drops everything that was loaded under it.
export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== SESSION_KEY });
    },
  });
};
