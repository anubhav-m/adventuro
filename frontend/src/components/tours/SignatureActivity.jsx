import { Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

// The one thing the trip is built around, on a quiet ground of the vertical's tint.
export function SignatureActivity({ activity }) {
  return (
    <section
      aria-labelledby="signature-activity"
      className="flex flex-col items-start gap-4 rounded-plate bg-accent-tint p-6 sm:p-8"
    >
      <h2 id="signature-activity" className="type-display text-h2">
        {activity.title}
      </h2>
      <Badge tone="outline" icon={Sparkles} className="text-accent-text">
        Signature activity
      </Badge>
      <p className="max-w-prose text-body-lg font-medium">{activity.description}</p>
    </section>
  );
}
