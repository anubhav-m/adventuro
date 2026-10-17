import { ArrowLeft } from 'lucide-react';
import { useId } from 'react';
import { FormProvider } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCreateGear, useUpdateGear } from '../../hooks/mutations/useGearMutations.js';
import { useEditorForm } from '../../hooks/useEditorForm.js';
import { gearPath, ROUTES } from '../../lib/constants.js';
import { EMPTY_GEAR_VALUES, toGearFormValues } from '../../lib/gearForm.js';
import { gearFormSchema } from '../../lib/schemas.js';
import { FormStatus } from '../forms/FormStatus.jsx';
import { SaveButton } from '../forms/SaveButton.jsx';
import { UnsavedChangesDialog } from '../forms/UnsavedChangesDialog.jsx';
import { PageHeader } from '../layout/PageHeader.jsx';
import { Button } from '../ui/Button.jsx';
import { GearDetailsFields } from './GearDetailsFields.jsx';
import { GearGroupingFields } from './GearGroupingFields.jsx';
import { GearSellingFields } from './GearSellingFields.jsx';

// The gear editor: one form and one Save. `gear` is the saved item, or absent for a new one.
export function GearForm({ gear }) {
  const isNew = !gear;
  const formId = useId();
  const navigate = useNavigate();
  const createGear = useCreateGear();
  const updateGear = useUpdateGear();

  const { form, session, blocker, status, submit } = useEditorForm({
    schema: gearFormSchema,
    defaultValues: isNew ? EMPTY_GEAR_VALUES : toGearFormValues(gear),
    save: (values) =>
      isNew
        ? createGear.mutateAsync(values)
        : updateGear.mutateAsync({ id: gear.id, changes: values }),
    toFormValues: toGearFormValues,
    onSaved: (saved, { allowNavigation }) => {
      toast.success(`${saved.name} saved.`);
      if (!isNew) return;
      allowNavigation();
      navigate(gearPath(saved.id), { replace: true });
    },
  });

  return (
    <>
      <PageHeader
        title={isNew ? 'New gear' : gear.name}
        description={isNew ? 'An affiliate product for the gear store.' : `/${gear.slug}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" icon={ArrowLeft} to={ROUTES.GEAR}>
              All gear
            </Button>
            <SaveButton formId={formId} control={form.control} />
          </div>
        }
      />
      <FormProvider {...form}>
        <form id={formId} noValidate onSubmit={submit()} className="flex flex-col gap-5">
          <FormStatus error={status} />
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="flex min-w-0 flex-col gap-5">
              <GearDetailsFields isNew={isNew} session={session} />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <GearSellingFields />
              <GearGroupingFields />
            </div>
          </div>
        </form>
      </FormProvider>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
