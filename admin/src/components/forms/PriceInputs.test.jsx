import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { toGearFormValues } from '../../lib/gearForm.js';
import { FIELD_MESSAGES, gearFormSchema } from '../../lib/schemas.js';
import { GEAR } from '../../test/fixtures.js';
import { PriceInputs } from './PriceInputs.jsx';

// The prices inside the gear form's own schema, checked as they change.
const Harness = () => {
  const form = useForm({
    resolver: zodResolver(gearFormSchema),
    defaultValues: toGearFormValues(GEAR),
    mode: 'onChange',
  });
  return (
    <FormProvider {...form}>
      <PriceInputs />
    </FormProvider>
  );
};

const mrp = () => screen.getByRole('spinbutton', { name: 'MRP' });
const salePrice = () => screen.getByRole('spinbutton', { name: 'Sale price' });

describe('PriceInputs', () => {
  it('shows both prices and how far the sale price is below the MRP', () => {
    render(<Harness />);

    expect(mrp()).toHaveValue(1999);
    expect(salePrice()).toHaveValue(1499);
    expect(salePrice()).toHaveAccessibleDescription('25% below the MRP.');
  });

  it('refuses a sale price above the MRP, and checks it again when the MRP changes', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.clear(salePrice());
    await user.type(salePrice(), '2500');
    await waitFor(() => expect(salePrice()).toHaveAccessibleDescription(FIELD_MESSAGES.salePrice));

    await user.clear(mrp());
    await user.type(mrp(), '2999');
    await waitFor(() => expect(salePrice()).not.toHaveAttribute('aria-invalid'));
    expect(salePrice()).toHaveAccessibleDescription('17% below the MRP.');
  });

  it('asks for whole rupees of at least ₹1', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.clear(mrp());
    await waitFor(() => expect(mrp()).toHaveAccessibleDescription(FIELD_MESSAGES.mrp));

    await user.type(mrp(), '0');
    await waitFor(() => expect(mrp()).toHaveAccessibleDescription(FIELD_MESSAGES.mrp));
    expect(salePrice()).toHaveAccessibleDescription('At or below the MRP.');
  });
});
