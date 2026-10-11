import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Backpack } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/ApiError.js';
import { renderApp } from '../../test/render.jsx';
import { Badge } from './Badge.jsx';
import { Card } from './Card.jsx';
import { Chip } from './Chip.jsx';
import { ChipGroup } from './ChipGroup.jsx';
import { EmptyState } from './EmptyState.jsx';
import { ErrorState } from './ErrorState.jsx';
import { Field } from './Field.jsx';
import { IconButton } from './IconButton.jsx';
import { Input } from './Input.jsx';
import { Price } from './Price.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { Select } from './Select.jsx';
import { Skeleton } from './Skeleton.jsx';
import { Spinner } from './Spinner.jsx';
import { Stepper } from './Stepper.jsx';

describe('Field, Input and Select', () => {
  it('labels the control and describes it with the hint', () => {
    renderApp(
      <Field label="Phone" hint="10 digits, without +91">
        {(control) => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Phone' });

    expect(input).toHaveAccessibleDescription('10 digits, without +91');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('replaces the hint with the error and marks the control invalid', () => {
    renderApp(
      <Field label="Phone" hint="10 digits, without +91" error="Enter a valid number.">
        {(control) => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Phone' });

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Enter a valid number.');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid number.');
    expect(screen.queryByText('10 digits, without +91')).not.toBeInTheDocument();
  });

  it('can hide its label visually while keeping the name', () => {
    renderApp(
      <Field label="Search gear" hideLabel>
        {(control) => <Input type="search" {...control} />}
      </Field>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search gear' })).toBeInTheDocument();
    expect(screen.getByText('Search gear')).toHaveClass('sr-only');
  });

  it('renders a select with a placeholder option and reports changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderApp(
      <Field label="Sort by">
        {(control) => (
          <Select
            {...control}
            placeholder="Choose"
            defaultValue=""
            onChange={(event) => onChange(event.target.value)}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price_asc', label: 'Price: low to high' },
            ]}
          />
        )}
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Sort by' });

    expect(screen.getAllByRole('option')).toHaveLength(3);
    await user.selectOptions(select, 'price_asc');
    expect(onChange).toHaveBeenCalledWith('price_asc');
  });
});

describe('Stepper', () => {
  const setup = (value) => {
    const onChange = vi.fn();
    renderApp(<Stepper label="travelers" value={value} min={1} max={20} onChange={onChange} />);
    return { onChange, user: userEvent.setup() };
  };

  it('steps down and up from the current value', async () => {
    const { onChange, user } = setup(2);

    expect(screen.getByRole('group', { name: 'travelers' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2');
    await user.click(screen.getByRole('button', { name: 'Fewer travelers' }));
    await user.click(screen.getByRole('button', { name: 'More travelers' }));
    expect(onChange.mock.calls).toEqual([[1], [3]]);
  });

  it('stops at the minimum and at the maximum', () => {
    setup(1);
    expect(screen.getByRole('button', { name: 'Fewer travelers' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More travelers' })).toBeEnabled();
  });

  it('stops at the maximum', () => {
    setup(20);
    expect(screen.getByRole('button', { name: 'More travelers' })).toBeDisabled();
  });
});

describe('Chip and ChipGroup', () => {
  it('is a toggle button, a link, or plain text depending on its props', () => {
    renderApp(
      <>
        <Chip selected onClick={vi.fn()}>
          Backpacks
        </Chip>
        <Chip to="/gear?category=caps">Caps</Chip>
        <Chip icon={Backpack}>Parasailing</Chip>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Backpacks' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Caps' })).toHaveAttribute(
      'href',
      '/gear?category=caps',
    );
    expect(screen.getByText('Parasailing').tagName).toBe('SPAN');
  });

  it('selects one option, and clears it when chosen again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderApp(
      <ChipGroup
        label="Category"
        value="shoes"
        onChange={onChange}
        options={[
          { value: 'backpacks', label: 'Backpacks' },
          { value: 'shoes', label: 'Shoes' },
        ]}
      />,
    );

    expect(screen.getByRole('group', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shoes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Backpacks' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Backpacks' }));
    await user.click(screen.getByRole('button', { name: 'Shoes' }));
    expect(onChange.mock.calls).toEqual([['backpacks'], [null]]);
  });
});

describe('Price', () => {
  it('formats the amount in rupees', () => {
    renderApp(<Price amount={14999} prefix="from" />);
    expect(screen.getByText('₹14,999')).toBeInTheDocument();
    expect(screen.getByText('from')).toBeInTheDocument();
  });

  it('strikes through the MRP only when it is higher than the price', () => {
    const { unmount } = renderApp(<Price amount={2899} mrp={3999} />);
    expect(screen.getByText('₹3,999').closest('s')).toHaveTextContent('MRP ₹3,999');
    unmount();

    renderApp(<Price amount={2899} mrp={2899} />);
    expect(screen.getAllByText('₹2,899')).toHaveLength(1);
  });
});

describe('ErrorState and EmptyState', () => {
  it('shows text from the error map, never the error itself', () => {
    renderApp(<ErrorState error={new ApiError({ status: 429, code: 'RATE_LIMITED' })} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      "You're going a bit fast. Please wait a moment and try again.",
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('offers a retry when given one', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderApp(<ErrorState error={new Error('boom')} onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).not.toHaveTextContent('boom');
  });

  it('renders an empty state with its description and action', () => {
    renderApp(
      <EmptyState
        icon={Backpack}
        title="No gear matches."
        description="Try fewer filters."
        action={<button type="button">Clear filters</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No gear matches.' })).toBeInTheDocument();
    expect(screen.getByText('Try fewer filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});

describe('small primitives', () => {
  it('IconButton takes its accessible name from `label`', () => {
    renderApp(<IconButton icon={Backpack} label="Open gear" />);
    expect(screen.getByRole('button', { name: 'Open gear' })).toHaveAttribute('type', 'button');
  });

  it('Badge shows its word and tone', () => {
    renderApp(<Badge tone="success">Completed</Badge>);
    expect(screen.getByText('Completed')).toHaveClass('bg-success-tint', 'text-success');
  });

  it('Card renders as the element asked for', () => {
    renderApp(
      <Card as="article" interactive>
        Goa
      </Card>,
    );
    expect(screen.getByRole('article')).toHaveClass('bg-surface', 'rounded-plate');
  });

  it('SectionHeader renders the heading, lead and action', () => {
    renderApp(
      <SectionHeader
        id="gear-heading"
        title="Gear For Every Terrain"
        lead="Packed for where you are going."
        action={<a href="/gear">See all</a>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Gear For Every Terrain' }),
    ).toHaveAttribute('id', 'gear-heading');
    expect(screen.getByText('Packed for where you are going.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all' })).toBeInTheDocument();
  });

  it('Spinner announces itself only when labelled; Skeleton is hidden from assistive tech', () => {
    const { container } = renderApp(
      <>
        <Spinner />
        <Spinner label="Loading trips" />
        <Skeleton className="h-6" />
      </>,
    );

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading trips');
    expect(container.querySelector('.bg-surface-raised')).toHaveAttribute('aria-hidden', 'true');
  });
});
