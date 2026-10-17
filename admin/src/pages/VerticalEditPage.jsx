import { useParams } from 'react-router';
import { EditorLoader } from '../components/forms/EditorLoader.jsx';
import { VerticalForm } from '../components/verticals/VerticalForm.jsx';
import { useVertical } from '../hooks/queries/useVerticals.js';

export function VerticalEditPage() {
  const { id } = useParams();
  const vertical = useVertical(id);

  return (
    <EditorLoader query={vertical} title="Edit vertical">
      {(data) => <VerticalForm key={data.id} vertical={data} />}
    </EditorLoader>
  );
}
