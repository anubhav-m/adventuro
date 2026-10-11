import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from '../../api/auth.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// Signing out drops everything that belonged to the user: the session and their bookings.
export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.removeQueries({ queryKey: queryKeys.bookings.all });
    },
  });
};
