import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGear, deleteGear, updateGear } from '../../api/gear.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// A saved item is put straight into its detail query, and every list is read again (a tour's
// Gear tab reads a list too).
const useGearMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (gear) => {
      queryClient.setQueryData(queryKeys.gear.detail(gear.id), gear);
      return queryClient.invalidateQueries({ queryKey: [...queryKeys.gear.all, 'list'] });
    },
  });
};

export const useCreateGear = () => useGearMutation(createGear);

export const useUpdateGear = () => useGearMutation(({ id, changes }) => updateGear(id, changes));

export const useDeleteGear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGear,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.gear.detail(id) });
      return queryClient.invalidateQueries({ queryKey: queryKeys.gear.all });
    },
  });
};
