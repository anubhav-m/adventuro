import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { slugify } from '../lib/slugify.js';

// The `slug` field of the surrounding form, kept in step with its `source` field ('title' or
// 'name'). On a new document the slug follows the source until the admin types their own, and
// emptying it hands it back. A saved document's slug never changes by itself: it is in a web
// address. Spread `sourceField` and `slugField` onto the two inputs; `slugHint` explains which.
export const useAutoSlug = ({ source, isNew }) => {
  const {
    register,
    setValue,
    formState: { isSubmitted },
  } = useFormContext();
  const [followsSource, setFollowsSource] = useState(isNew);

  const sourceField = register(source, {
    onChange: (event) => {
      if (!followsSource) return;
      setValue('slug', slugify(event.target.value), {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      });
    },
  });
  const slugField = register('slug', {
    onChange: (event) => setFollowsSource(event.target.value === ''),
  });

  return {
    sourceField,
    slugField,
    slugHint: followsSource
      ? `Follows the ${source} until you edit it.`
      : 'Part of the web address. Changing it breaks old links.',
  };
};
