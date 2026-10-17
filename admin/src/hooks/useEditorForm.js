import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { applyFieldErrors, clientError } from '../lib/errors.js';
import { useUnsavedChanges } from './useUnsavedChanges.js';
import { useUploadSession } from './useUploadSession.js';

// Everything an editor page shares: one react-hook-form form checked by `schema`, the uploads
// made on the page, the unsaved-changes guard, and the save itself.
// - `save(values)` resolves to the saved document; `toFormValues(saved)` makes it the form's new
//   starting point, so the form is clean again. `onSaved(saved, { allowNavigation })` follows
//   (a toast, and for a new document the move to its own page).
// - A failed save puts the server's field errors on their fields and keeps the error for the
//   top of the form.
// `submit(onInvalid)` is the form's onSubmit; `onInvalid(errors)` runs when the schema refuses.
// `status` is what the top of the form should say: the failed save, or that fields need fixing.
export const useEditorForm = ({ schema, defaultValues, save, toFormValues, onSaved }) => {
  const form = useForm({ resolver: zodResolver(schema), defaultValues, mode: 'onTouched' });
  const session = useUploadSession();
  const { blocker, allowNavigation } = useUnsavedChanges(form.formState.isDirty);
  const [saveError, setSaveError] = useState(null);

  const submit = (onInvalid) =>
    form.handleSubmit(async (values) => {
      setSaveError(null);
      try {
        const saved = await save(values);
        session.commit();
        form.reset(toFormValues(saved));
        onSaved(saved, { allowNavigation });
      } catch (error) {
        applyFieldErrors(error, form.setError);
        setSaveError(error);
      }
    }, onInvalid);

  const { isSubmitted, errors } = form.formState;
  const hasFieldErrors = Object.keys(errors).length > 0;
  const status =
    saveError ?? (isSubmitted && hasFieldErrors ? clientError('VALIDATION_ERROR') : null);

  return { form, session, blocker, status, submit };
};
