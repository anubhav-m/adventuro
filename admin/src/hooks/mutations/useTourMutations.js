import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { createTour, deleteTour, updateTour } from '../../api/tours.api.js';

// A saved tour is put straight into its detail query, and every list is read again.
const useTourMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (tour) => {
      queryClient.setQueryData(queryKeys.tours.detail(tour.id), tour);
      return queryClient.invalidateQueries({ queryKey: [...queryKeys.tours.all, 'list'] });
    },
  });
};

export const useCreateTour = () => useTourMutation(createTour);

export const useUpdateTour = () => useTourMutation(({ id, changes }) => updateTour(id, changes));

// Deleting a tour also takes it off every gear item that was linked to it.
export const useDeleteTour = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTour,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.tours.detail(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tours.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.gear.all }),
      ]);
    },
  });
};
