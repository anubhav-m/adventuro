import { useState } from 'react';
import { BookingBar } from '../booking/BookingBar.jsx';
import { SuggestedGear } from '../gear/SuggestedGear.jsx';
import { Badge } from '../ui/Badge.jsx';
import { InclusionList } from './InclusionList.jsx';
import { ItineraryTimeline } from './ItineraryTimeline.jsx';
import { ReportingInfo } from './ReportingInfo.jsx';
import { SignatureActivity } from './SignatureActivity.jsx';
import { TourGallery } from './TourGallery.jsx';
import { TourPackages } from './TourPackages.jsx';
import { TourSection } from './TourSection.jsx';

// Everything under the hero for a loaded tour. It holds the chosen package, which both Book
// actions (beside the packages, and the bar on smaller screens) carry into the booking modal.
export function TourDetail({ tour }) {
  const [tierId, setTierId] = useState(tour.tiers[0].id);

  return (
    <>
      <div className="mx-auto flex max-w-content flex-col gap-12 px-(--space-gutter) pt-10">
        <TourGallery title={tour.title} photos={tour.gallery} />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
          <div className="flex flex-col gap-12">
            <TourSection title="Overview">
              <p className="max-w-prose text-body-lg">{tour.overview}</p>
              {tour.topActivities.length > 0 && (
                <ul aria-label="Top activities" className="flex flex-wrap gap-2">
                  {tour.topActivities.map((activity) => (
                    <li key={activity}>
                      <Badge>{activity}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </TourSection>
            <SignatureActivity activity={tour.signatureActivity} />
            <ItineraryTimeline days={tour.itinerary} />
            <InclusionList inclusions={tour.inclusions} exclusions={tour.exclusions} />
            <ReportingInfo reporting={tour.reporting} />
          </div>
          <TourPackages
            tourSlug={tour.slug}
            tiers={tour.tiers}
            tierId={tierId}
            onTierChange={setTierId}
            className="lg:sticky lg:top-28"
          />
        </div>
      </div>
      <SuggestedGear
        title="Gear for this trip"
        lead="What we would pack for it."
        scope={{ tour: tour.slug }}
      />
      <BookingBar tourSlug={tour.slug} tier={tour.tiers.find((tier) => tier.id === tierId)} />
    </>
  );
}
