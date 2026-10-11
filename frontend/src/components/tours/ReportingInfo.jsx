import { Card } from '../ui/Card.jsx';
import { ReportingDetails } from './ReportingDetails.jsx';
import { TourSection } from './TourSection.jsx';

export function ReportingInfo({ reporting }) {
  return (
    <TourSection title="Where and when to report">
      <Card>
        <ReportingDetails reporting={reporting} />
      </Card>
    </TourSection>
  );
}
