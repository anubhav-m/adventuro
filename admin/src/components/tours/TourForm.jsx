import { ArrowLeft } from 'lucide-react';
import { useId } from 'react';
import { FormProvider } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useCreateTour, useUpdateTour } from '../../hooks/mutations/useTourMutations.js';
import { useEditorForm } from '../../hooks/useEditorForm.js';
import { ROUTES, tourPath } from '../../lib/constants.js';
import { ERROR_SUBJECT } from '../../lib/errors.js';
import { tourFormSchema } from '../../lib/schemas.js';
import {
  EMPTY_TOUR_VALUES,
  flaggedTabs,
  TOUR_TABS,
  toTourBody,
  toTourFormValues,
} from '../../lib/tourForm.js';
import { FormStatus } from '../forms/FormStatus.jsx';
import { ItineraryEditor } from '../forms/ItineraryEditor.jsx';
import { ListField } from '../forms/ListField.jsx';
import { SaveButton } from '../forms/SaveButton.jsx';
import { TierEditor } from '../forms/TierEditor.jsx';
import { UnsavedChangesDialog } from '../forms/UnsavedChangesDialog.jsx';
import { PageHeader } from '../layout/PageHeader.jsx';
import { Button } from '../ui/Button.jsx';
import { Tabs } from '../ui/Tabs.jsx';
import { TourBasicsFields } from './TourBasicsFields.jsx';
import { TourExperienceFields } from './TourExperienceFields.jsx';
import { TourLinkedGear } from './TourLinkedGear.jsx';
import { TourListsFields } from './TourListsFields.jsx';
import { TourMediaFields } from './TourMediaFields.jsx';
import { TourReportingFields } from './TourReportingFields.jsx';

const [FIRST_TAB] = TOUR_TABS;

// The tour editor: one form across eight tabs, and one Save. A tab with a field that needs
// fixing is flagged, and a refused save opens the first such tab. The open tab is in the URL.
// `tour` is the saved tour, or absent for a new one.
export function TourForm({ tour }) {
  const isNew = !tour;
  const formId = useId();
  const navigate = useNavigate();
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab = TOUR_TABS.some(({ id }) => id === requestedTab) ? requestedTab : FIRST_TAB.id;

  const { form, session, blocker, status, submit } = useEditorForm({
    schema: tourFormSchema,
    defaultValues: isNew ? EMPTY_TOUR_VALUES : toTourFormValues(tour),
    save: (values) => {
      const body = toTourBody(values, { isNew });
      return isNew
        ? createTour.mutateAsync(body)
        : updateTour.mutateAsync({ id: tour.id, changes: body });
    },
    toFormValues: toTourFormValues,
    onSaved: (saved, { allowNavigation }) => {
      toast.success(`${saved.title} saved.`);
      if (!isNew) return;
      allowNavigation();
      navigate(tourPath(saved.id), { replace: true });
    },
  });

  const openTab = (id) =>
    setSearchParams(id === FIRST_TAB.id ? {} : { tab: id }, {
      replace: true,
      preventScrollReset: true,
    });

  const showFirstFlaggedTab = (errors) => {
    const flagged = flaggedTabs(errors);
    if (flagged.length > 0 && !flagged.includes(tab)) openTab(flagged[0]);
  };

  const flagged = flaggedTabs(form.formState.errors);
  const panels = {
    basics: <TourBasicsFields isNew={isNew} />,
    media: <TourMediaFields session={session} />,
    experience: <TourExperienceFields />,
    itinerary: (
      <ListField
        name="itinerary"
        render={(field, error) => (
          <ItineraryEditor value={field.value} onChange={field.onChange} error={error} />
        )}
      />
    ),
    lists: <TourListsFields />,
    packages: (
      <ListField
        name="tiers"
        render={(field, error) => (
          <TierEditor value={field.value} onChange={field.onChange} error={error} />
        )}
      />
    ),
    reporting: <TourReportingFields />,
    gear: <TourLinkedGear tourId={tour?.id} />,
  };

  return (
    <>
      <PageHeader
        title={isNew ? 'New tour' : tour.title}
        description={isNew ? 'Saved as a draft unless you publish it.' : `/${tour.slug}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" icon={ArrowLeft} to={ROUTES.TOURS}>
              All tours
            </Button>
            <SaveButton formId={formId} control={form.control} />
          </div>
        }
      />
      <FormProvider {...form}>
        <form
          id={formId}
          noValidate
          onSubmit={submit(showFirstFlaggedTab)}
          className="flex flex-col gap-5"
        >
          <FormStatus error={status} subject={ERROR_SUBJECT.TOUR} />
          <Tabs
            label="Tour sections"
            value={tab}
            onChange={openTab}
            tabs={TOUR_TABS.map(({ id, label }) => ({
              id,
              label,
              flagged: flagged.includes(id),
              content: panels[id],
            }))}
          />
        </form>
      </FormProvider>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
