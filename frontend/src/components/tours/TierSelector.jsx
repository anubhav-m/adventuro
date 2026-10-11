import { useId } from 'react';
import { cn } from '../../lib/cn.js';
import { Price } from '../ui/Price.jsx';

// The tour's packages as one choice. `value` is the chosen tier's id.
export function TierSelector({ tiers, value, onChange }) {
  const name = useId();

  return (
    <fieldset>
      <legend className="sr-only">Package</legend>
      <div className="flex flex-col gap-3">
        {tiers.map((tier) => {
          const selected = tier.id === value;
          return (
            <label
              key={tier.id}
              className={cn(
                'flex cursor-pointer items-start gap-4 rounded-plate border-(length:--border-ink) p-4 transition-colors duration-(--duration-fast) ease-out',
                selected
                  ? 'border-accent-text bg-accent-tint'
                  : 'border-border bg-surface hover:border-border-strong',
              )}
            >
              <input
                type="radio"
                name={name}
                value={tier.id}
                checked={selected}
                onChange={() => onChange(tier.id)}
                className="mt-1 size-5 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-h4 leading-tight font-extrabold">{tier.name}</span>
                {tier.description && (
                  <span
                    className={cn('mt-1 block text-sm', selected ? 'text-text' : 'text-text-muted')}
                  >
                    {tier.description}
                  </span>
                )}
              </span>
              <span className="flex flex-col items-end">
                <Price amount={tier.pricePerPerson} className="text-h4" />
                <span
                  className={cn('text-xs font-medium', selected ? 'text-text' : 'text-text-muted')}
                >
                  per person
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
