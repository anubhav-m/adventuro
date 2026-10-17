import { ArrowLeft } from 'lucide-react';
import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { useUpdateVertical } from '../../hooks/mutations/useVerticalMutations.js';
import { useEditorForm } from '../../hooks/useEditorForm.js';
import { LIMITS, ROUTES, UPLOAD_FOLDER } from '../../lib/constants.js';
import { verticalFormSchema } from '../../lib/schemas.js';
import { FormStatus } from '../forms/FormStatus.jsx';
import { ImageUploader } from '../forms/ImageUploader.jsx';
import { SaveButton } from '../forms/SaveButton.jsx';
import { UnsavedChangesDialog } from '../forms/UnsavedChangesDialog.jsx';
import { PageHeader } from '../layout/PageHeader.jsx';
import { Button } from '../ui/Button.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';

const toFormValues = (vertical) => ({
  subtitle: vertical.subtitle ?? '',
  description: vertical.description ?? '',
  heroImage: vertical.heroImage
    ? { url: vertical.heroImage.url, path: vertical.heroImage.path ?? null }
    : null,
});

// A vertical's words and hero image. Its key, code and name are fixed.
export function VerticalForm({ vertical }) {
  const formId = useId();
  const updateVertical = useUpdateVertical();
  const { form, session, blocker, status, submit } = useEditorForm({
    schema: verticalFormSchema,
    defaultValues: toFormValues(vertical),
    save: (changes) => updateVertical.mutateAsync({ id: vertical.id, changes }),
    toFormValues,
    onSaved: (saved) => toast.success(`${saved.name} saved.`),
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <PageHeader
        title={vertical.name}
        description="The words and the hero image on this vertical’s page."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" icon={ArrowLeft} to={ROUTES.VERTICALS}>
              All verticals
            </Button>
            <SaveButton formId={formId} control={control} />
          </div>
        }
      />
      <form id={formId} noValidate onSubmit={submit()} className="flex max-w-3xl flex-col gap-5">
        <FormStatus error={status} />
        <Field label="Subtitle" error={errors.subtitle?.message}>
          {(controlProps) => (
            <Input {...controlProps} maxLength={LIMITS.SHORT_TEXT_MAX} {...register('subtitle')} />
          )}
        </Field>
        <Field label="Description" error={errors.description?.message}>
          {(controlProps) => (
            <Textarea
              {...controlProps}
              rows={6}
              maxLength={LIMITS.LONG_TEXT_MAX}
              {...register('description')}
            />
          )}
        </Field>
        <Controller
          name="heroImage"
          control={control}
          render={({ field, fieldState }) => (
            <ImageUploader
              label="Hero image"
              value={field.value}
              onChange={field.onChange}
              folder={UPLOAD_FOLDER.VERTICALS}
              session={session}
              error={fieldState.error?.message}
            />
          )}
        />
      </form>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
