import { useId } from 'react';
import { Card } from '../ui/Card.jsx';
import { DetailList } from './DetailList.jsx';

// A titled plate of facts: the sections of a detail page. `items` as in DetailList.
export function DetailCard({ title, items }) {
  const titleId = useId();
  return (
    <Card as="section" aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2 id={titleId} className="text-body font-extrabold">
        {title}
      </h2>
      <DetailList items={items} />
    </Card>
  );
}
