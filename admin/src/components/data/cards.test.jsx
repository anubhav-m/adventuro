import { render, screen, within } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { ChartCard } from './ChartCard.jsx';
import { ChartTooltip } from './ChartTooltip.jsx';
import { StatCard } from './StatCard.jsx';

describe('StatCard', () => {
  it('shows a label, its figure in tabular numerals, and what it counts', () => {
    render(<StatCard label="Total users" value="1,234" hint="All time" icon={Users} />);

    expect(screen.getByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toHaveClass('tabular-nums');
    expect(screen.getByText('All time')).toBeInTheDocument();
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('needs neither a hint nor an icon', () => {
    const { container } = render(<StatCard label="Bookings" value="4" />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('ChartCard', () => {
  const chart = (props) => (
    <ChartCard
      title="Bookings by status"
      columns={['Status', 'Bookings']}
      rows={[
        ['Confirmed', '2'],
        ['Cancelled', '1'],
      ]}
      {...props}
    >
      <svg data-testid="drawing" />
    </ChartCard>
  );

  it('is a named section whose drawing is hidden from assistive technology', () => {
    render(chart({ description: 'In this range.' }));

    expect(screen.getByRole('region', { name: 'Bookings by status' })).toHaveTextContent(
      'In this range.',
    );
    expect(screen.getByTestId('drawing').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives the same figures as a table for screen readers', () => {
    render(chart());
    const table = screen.getByRole('table', { name: 'Bookings by status' });

    expect(table).toHaveClass('sr-only');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Status', 'Bookings']);
    expect(within(table).getByRole('rowheader', { name: 'Cancelled' })).toBeInTheDocument();
    expect(
      within(table)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['2', '1']);
  });

  it('says there is nothing to draw instead of drawing an empty chart', () => {
    render(chart({ empty: true }));

    expect(screen.getByText('Nothing in this range yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('drawing')).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Bookings by status' })).toBeInTheDocument();
  });
});

describe('ChartTooltip', () => {
  const props = {
    title: (row) => row.label,
    lines: (row) => [{ label: 'Bookings', value: String(row.value) }],
  };

  it('shows the hovered row as a title and its lines', () => {
    const { container } = render(
      <ChartTooltip active payload={[{ payload: { label: 'TideTrail', value: 3 } }]} {...props} />,
    );

    expect(container).toHaveTextContent('TideTrail');
    expect(container).toHaveTextContent('Bookings3');
  });

  it('shows nothing when no point is hovered', () => {
    const { container, rerender } = render(<ChartTooltip active={false} payload={[]} {...props} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ChartTooltip active {...props} />);
    expect(container).toBeEmptyDOMElement();
  });
});
