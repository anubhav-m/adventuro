import { Reveal } from '../ui/Reveal.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { TourCard } from './TourCard.jsx';

const GRID = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3';

// The tour cards, or with `loading` that many placeholder cards in the same grid.
export function TourGrid({ tours, verticalKey, loading }) {
  if (loading) {
    return (
      <div className={GRID}>
        {Array.from({ length: loading }, (_, index) => (
          <Skeleton key={index} className="aspect-3/4" />
        ))}
      </div>
    );
  }

  return (
    <Reveal as="ul" stagger className={GRID}>
      {tours.map((tour) => (
        <li key={tour.id}>
          <TourCard tour={tour} verticalKey={verticalKey} />
        </li>
      ))}
    </Reveal>
  );
}
