import { Card } from '../ui/Card.jsx';

// One headline figure. `value` is already formatted; `hint` says what it counts.
export function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="flex items-center justify-between gap-2 text-sm font-bold text-text-muted">
        {label}
        {Icon && <Icon size={18} strokeWidth={1.75} aria-hidden="true" />}
      </p>
      <p className="text-h3 leading-tight font-extrabold tabular-nums">{value}</p>
      {hint && <p className="text-xs font-medium text-text-muted">{hint}</p>}
    </Card>
  );
}
