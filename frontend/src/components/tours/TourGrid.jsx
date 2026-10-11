import { TourCard } from './TourCard.jsx';

export function TourGrid({ tours, verticalKey }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tours.map((tour) => (
        <li key={tour.id}>
          <TourCard tour={tour} verticalKey={verticalKey} />
        </li>
      ))}
    </ul>
  );
}
