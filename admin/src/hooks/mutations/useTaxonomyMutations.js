import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys.js';
import { createTaxonomy, deleteTaxonomy, updateTaxonomy } from '../../api/taxonomies.api.js';

// Gear shows its category by name, so a change to any list reads the gear again too.
const useTaxonomyMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.taxonomies.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.gear.all }),
      ]),
  });
};

export const useCreateTaxonomy = () => useTaxonomyMutation(createTaxonomy);

export const useUpdateTaxonomy = () =>
  useTaxonomyMutation(({ id, changes }) => updateTaxonomy(id, changes));

export const useDeleteTaxonomy = () => useTaxonomyMutation(deleteTaxonomy);
