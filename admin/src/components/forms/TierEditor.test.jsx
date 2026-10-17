import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TierEditor } from './TierEditor.jsx';

const TIERS = [
  { id: 't1', name: 'Essential', description: 'Shared stay', pricePerPerson: 14999 },
  { id: 't2', name: 'Explorer', description: '', pricePerPerson: 18749 },
];

const Harness = ({ initial, onChange = () => {}, error }) => {
  const [value, setValue] = useState(initial);
  return (
    <TierEditor
      value={value}
      error={error}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const names = () => screen.getAllByRole('textbox', { name: 'Name' }).map((input) => input.value);

describe('TierEditor', () => {
  it('edits a package’s name, price and description, keeping its id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={TIERS.slice(0, 1)} onChange={onChange} />);

    const price = screen.getByRole('spinbutton', { name: 'Price per person' });
    await user.clear(price);
    await user.type(price, '15999');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' Plus');
    await user.type(screen.getByRole('textbox', { name: 'What it includes' }), ', breakfast');

    expect(onChange).toHaveBeenLastCalledWith([
      {
        id: 't1',
        name: 'Essential Plus',
        description: 'Shared stay, breakfast',
        pricePerPerson: 15999,
      },
    ]);

    // An empty price is '', which the form's schema refuses.
    await user.clear(price);
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ pricePerPerson: '' })]);
    expect(price).toHaveValue(null);
  });

  it('adds packages up to five and says so', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={TIERS} onChange={onChange} />);
    const add = screen.getByRole('button', { name: 'Add package' });

    await user.click(add);
    expect(onChange).toHaveBeenLastCalledWith([
      ...TIERS,
      { name: '', description: '', pricePerPerson: '' },
    ]);
    await user.click(add);
    await user.click(add);

    expect(screen.getAllByRole('group')).toHaveLength(5);
    expect(add).toBeDisabled();
    expect(screen.getByText('That’s the most a tour can have (5).')).toBeInTheDocument();
  });

  it('never removes the last package', async () => {
    const user = userEvent.setup();
    render(<Harness initial={TIERS} />);

    await user.click(screen.getByRole('button', { name: 'Remove Package 1' }));

    expect(names()).toEqual(['Explorer']);
    expect(screen.getByRole('button', { name: 'Remove Package 1' })).toBeDisabled();
  });

  it('reorders packages', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={TIERS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Move Package 2 up' }));

    expect(onChange).toHaveBeenLastCalledWith([TIERS[1], TIERS[0]]);
    expect(names()).toEqual(['Explorer', 'Essential']);
    const prices = screen.getAllByRole('spinbutton', { name: 'Price per person' });
    expect(prices.map((input) => input.value)).toEqual(['18749', '14999']);
  });

  it('shows each package’s errors and the list’s own', () => {
    render(
      <Harness
        initial={[TIERS[0], { ...TIERS[1], name: 'essential' }]}
        error={{
          message: 'Offer 1 to 5 packages.',
          1: { name: { message: 'Use a different name.' } },
        }}
      />,
    );

    const [first, second] = screen.getAllByRole('textbox', { name: 'Name' });
    expect(first).not.toHaveAttribute('aria-invalid');
    expect(second).toHaveAccessibleDescription('Use a different name.');
    expect(screen.getByText('Offer 1 to 5 packages.')).toBeInTheDocument();
  });
});
