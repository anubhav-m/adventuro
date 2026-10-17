import { useId } from 'react';
import { Card } from '../ui/Card.jsx';

// A titled group of fields on an editor page that is not split into tabs.
export function FormSection({ title, children }) {
  const titleId = useId();
  return (
    <Card as="section" aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2 id={titleId} className="text-h4 font-extrabold">
        {title}
      </h2>
      {children}
    </Card>
  );
}
