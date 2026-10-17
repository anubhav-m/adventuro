import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { updateVertical } from '../../api/verticals.api.js';

export const useUpdateVertical = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => updateVertical(id, changes),
    onSuccess: (vertical) => {
      queryClient.setQueryData(queryKeys.verticals.detail(vertical.id), vertical);
      return queryClient.invalidateQueries({ queryKey: queryKeys.verticals.all, exact: true });
    },
  });
};
