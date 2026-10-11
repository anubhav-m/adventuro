import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { cn } from '../../lib/cn.js';
import { bookingLink, BOOKING_SECTION_ID } from '../../lib/constants.js';
import { Button } from '../ui/Button.jsx';
import { TierSelector } from './TierSelector.jsx';
import { TourSection } from './TourSection.jsx';

// The tour's packages, with Book for the chosen one. The tour loads after the router has
// handled a `#book` link's hash, so the section brings itself into view. Below the desktop
// layout the page's booking bar carries Book instead.
export function TourPackages({ tourSlug, tiers, tierId, onTierChange, className }) {
  const sectionRef = useRef(null);
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === `#${BOOKING_SECTION_ID}`) sectionRef.current.scrollIntoView();
  }, [hash]);

  return (
    <TourSection
      ref={sectionRef}
      id={BOOKING_SECTION_ID}
      title="Choose your package"
      className={cn('scroll-mt-24', className)}
    >
      <TierSelector tiers={tiers} value={tierId} onChange={onTierChange} hideLegend />
      <Button to={bookingLink(tourSlug, tierId)} preventScrollReset className="max-lg:hidden">
        Book this trip
      </Button>
    </TourSection>
  );
}
