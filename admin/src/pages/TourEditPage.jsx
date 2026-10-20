import { useParams } from 'react-router';
import { DocumentLoader } from '../components/layout/DocumentLoader.jsx';
import { TourForm } from '../components/tours/TourForm.jsx';
import { useTour } from '../hooks/queries/useTours.js';

// /tours/new and /tours/:id share this page: a new tour has no id.
export function TourEditPage() {
  const { id } = useParams();
  const tour = useTour(id, { enabled: Boolean(id) });

  if (!id) return <TourForm />;
  return (
    <DocumentLoader query={tour} title="Edit tour">
      {(data) => <TourForm key={data.id} tour={data} />}
    </DocumentLoader>
  );
}
