import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ItineraryEditor } from './ItineraryEditor.jsx';

const DAYS = [
  { day: 1, title: 'Arrival', description: 'Check in.' },
  { day: 2, title: 'Water sports', description: '' },
  { day: 3, title: 'Departure', description: '' },
];

const Harness = ({ initial, onChange = () => {}, error }) => {
  const [value, setValue] = useState(initial);
  return (
    <ItineraryEditor
      value={value}
      error={error}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

// Each day as [its heading, its title].
const days = () =>
  screen
    .getAllByRole('group')
    .map((group) => [
      group.querySelector('legend').textContent,
      group.querySelector('input').value,
    ]);

describe('ItineraryEditor', () => {
  it('adds days numbered after the last one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={[]} onChange={onChange} />);

    expect(screen.getByText('No days yet. Add the first day of the trip.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add day' }));
    await user.click(screen.getByRole('button', { name: 'Add day' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { day: 1, title: '', description: '' },
      { day: 2, title: '', description: '' },
    ]);
    expect(screen.getByRole('group', { name: 'Day 2' })).toBeInTheDocument();
  });

  it('edits a day’s title and plan', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={DAYS.slice(0, 1)} onChange={onChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Title' }), '!');
    await user.type(screen.getByRole('textbox', { name: 'Plan for the day' }), ' Dinner.');

    expect(onChange).toHaveBeenLastCalledWith([
      { day: 1, title: 'Arrival!', description: 'Check in. Dinner.' },
    ]);
  });

  it('renumbers the days when one moves', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={DAYS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Move Day 3 up' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { day: 1, title: 'Arrival', description: 'Check in.' },
      { day: 2, title: 'Departure', description: '' },
      { day: 3, title: 'Water sports', description: '' },
    ]);
    expect(days()).toEqual([
      ['Day 1', 'Arrival'],
      ['Day 2', 'Departure'],
      ['Day 3', 'Water sports'],
    ]);

    await user.click(screen.getByRole('button', { name: 'Move Day 1 down' }));
    expect(days().map(([, title]) => title)).toEqual(['Departure', 'Arrival', 'Water sports']);
    expect(screen.getByRole('button', { name: 'Move Day 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Day 3 down' })).toBeDisabled();
  });

  it('renumbers the days when one is removed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={DAYS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remove Day 1' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { day: 1, title: 'Water sports', description: '' },
      { day: 2, title: 'Departure', description: '' },
    ]);
    expect(days()).toEqual([
      ['Day 1', 'Water sports'],
      ['Day 2', 'Departure'],
    ]);
  });

  it('shows each day’s errors on its fields, and the list’s own', () => {
    render(
      <Harness
        initial={[{ day: 1, title: '', description: '' }]}
        error={{ message: 'Keep to 60 days.', 0: { title: { message: 'Give this day a title.' } } }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAccessibleDescription(
      'Give this day a title.',
    );
    expect(screen.getByText('Keep to 60 days.')).toBeInTheDocument();
  });
});
