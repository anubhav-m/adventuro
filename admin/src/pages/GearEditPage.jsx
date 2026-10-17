import { useParams } from 'react-router';
import { EditorLoader } from '../components/forms/EditorLoader.jsx';
import { GearForm } from '../components/gear/GearForm.jsx';
import { useGear } from '../hooks/queries/useGear.js';

// /gear/new and /gear/:id share this page: a new item has no id.
export function GearEditPage() {
  const { id } = useParams();
  const gear = useGear(id, { enabled: Boolean(id) });

  if (!id) return <GearForm />;
  return (
    <EditorLoader query={gear} title="Edit gear">
      {(data) => <GearForm key={data.id} gear={data} />}
    </EditorLoader>
  );
}
