import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { updateMe } from '../../api/auth.api.js';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
};
