import { useParams } from 'react-router';
import { DocumentLoader } from '../components/layout/DocumentLoader.jsx';
import { VerticalForm } from '../components/verticals/VerticalForm.jsx';
import { useVertical } from '../hooks/queries/useVerticals.js';

export function VerticalEditPage() {
  const { id } = useParams();
  const vertical = useVertical(id);

  return (
    <DocumentLoader query={vertical} title="Edit vertical">
      {(data) => <VerticalForm key={data.id} vertical={data} />}
    </DocumentLoader>
  );
}
