import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { cn } from '../../lib/cn.js';
import { BOOKING_SECTION_ID } from '../../lib/constants.js';
import { TierSelector } from './TierSelector.jsx';
import { TourSection } from './TourSection.jsx';

// The tour's packages, and the target of every Book link. The tour loads after the router has
// handled the link's hash, so the section brings itself into view.
export function TourPackages({ tiers, tierId, onTierChange, className }) {
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
      <TierSelector tiers={tiers} value={tierId} onChange={onTierChange} />
    </TourSection>
  );
}
