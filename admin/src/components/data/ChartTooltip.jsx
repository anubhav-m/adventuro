// The box a chart shows beside the hovered point. `lines` turns the hovered row of the chart's
// data into its text: (row) => [{ label, value }].
export function ChartTooltip({ active, payload, title, lines }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-field border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text shadow-raised">
      <p className="font-bold">{title(row)}</p>
      {lines(row).map(({ label, value }) => (
        <p key={label} className="flex justify-between gap-4 text-text-muted tabular-nums">
          <span>{label}</span>
          <span className="font-bold text-text">{value}</span>
        </p>
      ))}
    </div>
  );
}
