import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signInWithGoogle } from '../../api/auth.api.js';
import { queryKeys } from '../../api/queryKeys.js';

export const useGoogleSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
};
