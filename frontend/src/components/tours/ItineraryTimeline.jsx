import { TourSection } from './TourSection.jsx';

export function ItineraryTimeline({ days }) {
  if (days.length === 0) return null;

  return (
    <TourSection title="Day by day">
      <ol>
        {days.map(({ day, title, description }) => (
          <li key={day} className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
            <div className="flex flex-col items-center">
              <span className="flex size-11 items-center justify-center rounded-pill border-(length:--border-ink) border-accent-text text-sm font-extrabold tabular-nums">
                <span className="sr-only">Day </span>
                {day}
              </span>
              <span aria-hidden="true" className="w-px flex-1 bg-border group-last:hidden" />
            </div>
            <div className="pt-2 pb-8 group-last:pb-0">
              <h3 className="text-h4 leading-tight font-extrabold">{title}</h3>
              {description && <p className="mt-2 max-w-prose text-text-muted">{description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </TourSection>
  );
}
