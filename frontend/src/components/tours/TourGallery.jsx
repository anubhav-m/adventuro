import { Photo } from '../ui/Photo.jsx';

export function TourGallery({ title, photos }) {
  if (photos.length === 0) return null;

  return (
    <ul aria-label="Photos" className="grid gap-4 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <li key={photo.url}>
          <Photo image={photo} alt={`${title}, photo ${index + 1}`} className="aspect-video" />
        </li>
      ))}
    </ul>
  );
}
