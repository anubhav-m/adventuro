import { formatPrice } from '../../lib/format.js';

const countLabel = (travelers) => `${travelers} ${travelers === 1 ? 'traveler' : 'travelers'}`;

// The live total for the chosen package. It is for reading only: the server works out the
// price of the booking itself.
export function PriceSummary({ tier, travelers }) {
  return (
    <div className="flex flex-col gap-1 tabular-nums">
      <p className="text-sm font-medium text-text-muted">
        {tier.name} · {formatPrice(tier.pricePerPerson)} × {countLabel(travelers)}
      </p>
      <p className="flex items-baseline justify-between gap-4">
        <span className="font-bold">Total</span>
        <output aria-label="Total" className="text-h3 font-extrabold">
          {formatPrice(tier.pricePerPerson * travelers)}
        </output>
      </p>
      <p className="text-xs font-medium text-text-muted">Nothing is charged when you confirm.</p>
    </div>
  );
}
