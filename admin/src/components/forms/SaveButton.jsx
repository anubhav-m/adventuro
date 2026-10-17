import { Save } from 'lucide-react';
import { useFormState } from 'react-hook-form';
import { Button } from '../ui/Button.jsx';

// The one Save of an editor, which may sit outside its <form> (in the page header): `formId`
// ties it to the form. It waits for changes, and shows the save in progress.
export function SaveButton({ formId, control }) {
  const { isDirty, isSubmitting } = useFormState({ control });

  return (
    <Button type="submit" form={formId} icon={Save} loading={isSubmitting} disabled={!isDirty}>
      Save
    </Button>
  );
}
