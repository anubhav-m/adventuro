import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Backpack } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/ApiError.js';
import { renderApp } from '../../test/render.jsx';
import { Avatar } from './Avatar.jsx';
import { Badge } from './Badge.jsx';
import { Checkbox } from './Checkbox.jsx';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { EmptyState } from './EmptyState.jsx';
import { ErrorState } from './ErrorState.jsx';
import { Field } from './Field.jsx';
import { IconButton } from './IconButton.jsx';
import { Input } from './Input.jsx';
import { MultiSelect } from './MultiSelect.jsx';
import { Segmented } from './Segmented.jsx';
import { Select } from './Select.jsx';
import { Spinner } from './Spinner.jsx';
import { Switch } from './Switch.jsx';
import { Tabs } from './Tabs.jsx';
import { Textarea } from './Textarea.jsx';
import { VerticalChip } from './VerticalChip.jsx';

describe('Field, Input, Textarea and Select', () => {
  it('labels the control and describes it with the hint', () => {
    render(
      <Field label="Slug" hint="Lowercase letters, numbers and dashes">
        {(control) => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Slug' });

    expect(input).toHaveAccessibleDescription('Lowercase letters, numbers and dashes');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveClass('h-10', 'text-sm');
  });

  it('replaces the hint with the error and marks the control invalid', () => {
    render(
      <Field label="Overview" hint="Shown on the tour page" error="Write an overview.">
        {(control) => <Textarea {...control} />}
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Overview' });

    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAccessibleDescription('Write an overview.');
    expect(screen.getByRole('alert')).toHaveTextContent('Write an overview.');
    expect(screen.queryByText('Shown on the tour page')).not.toBeInTheDocument();
  });

  it('can hide its label visually while keeping the name', () => {
    render(
      <Field label="From" hideLabel>
        {(control) => <Input type="date" {...control} />}
      </Field>,
    );
    expect(screen.getByLabelText('From')).toHaveAttribute('type', 'date');
    expect(screen.getByText('From')).toHaveClass('sr-only');
  });

  it('renders a select with a placeholder option and reports changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Field label="Status">
        {(control) => (
          <Select
            {...control}
            placeholder="All"
            defaultValue=""
            onChange={(event) => onChange(event.target.value)}
            options={[
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        )}
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Status' });

    expect(within(select).getAllByRole('option')).toHaveLength(3);
    await user.selectOptions(select, 'cancelled');
    expect(onChange).toHaveBeenCalledWith('cancelled');
  });
});

describe('Checkbox and Switch', () => {
  it('reports the new checked state of a checkbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Waterproof" checked={false} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Waterproof' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('is a switch that flips with a press and with the keyboard', async () => {
    function Example() {
      const [on, setOn] = useState(false);
      return <Switch label="Published" checked={on} onChange={setOn} />;
    }
    const user = userEvent.setup();
    render(<Example />);
    const control = screen.getByRole('switch', { name: 'Published' });

    expect(control).toHaveAttribute('aria-checked', 'false');
    await user.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    expect(control).toHaveAttribute('aria-checked', 'false');
  });

  it('keeps its name when the label is hidden, and does nothing when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Active" checked onChange={onChange} hideLabel disabled />);
    const control = screen.getByRole('switch', { name: 'Active' });

    expect(control).toHaveTextContent('');
    await user.click(control);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Segmented', () => {
  const OPTIONS = [
    { value: '30', label: '30 days' },
    { value: '7', label: '7 days' },
  ];

  it('marks the chosen option and reports another', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Date range" options={OPTIONS} value="30" onChange={onChange} />);

    expect(screen.getByRole('group', { name: 'Date range' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '7 days' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('7');
  });

  it('shows only icons when asked, keeping each label as the name', () => {
    render(
      <Segmented
        label="Theme"
        iconOnly
        options={[{ value: 'gear', label: 'Gear', icon: Backpack }]}
        value="gear"
        onChange={vi.fn()}
      />,
    );
    const option = screen.getByRole('button', { name: 'Gear' });

    expect(option).toHaveTextContent('');
    expect(option.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Tabs', () => {
  const TABS = [
    { id: 'basics', label: 'Basics', content: <input aria-label="Title" /> },
    { id: 'media', label: 'Media', content: <p>Cover image</p>, flagged: true },
    { id: 'packages', label: 'Packages', content: <p>Tiers</p> },
  ];

  function Example() {
    const [value, setValue] = useState('basics');
    return <Tabs label="Tour sections" tabs={TABS} value={value} onChange={setValue} />;
  }

  const tab = (name) => screen.getByRole('tab', { name });

  it('shows the open tab’s panel and keeps the others mounted but hidden', () => {
    render(<Example />);

    expect(screen.getByRole('tablist', { name: 'Tour sections' })).toBeInTheDocument();
    expect(tab('Basics')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Basics' })).toBeVisible();
    expect(screen.getByText('Cover image')).not.toBeVisible();
    expect(screen.getByText('Tiers')).toBeInTheDocument();
  });

  it('opens a tab on click and ties it to its panel', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(tab('Packages'));

    expect(tab('Packages')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Basics')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Packages' });
    expect(panel).toHaveAttribute('id', tab('Packages').getAttribute('aria-controls'));
    expect(screen.getByRole('textbox', { name: 'Title', hidden: true })).not.toBeVisible();
  });

  it('moves with the arrow keys, Home and End, wrapping at the ends', async () => {
    const user = userEvent.setup();
    render(<Example />);
    tab('Basics').focus();

    await user.keyboard('{ArrowRight}');
    expect(tab(/Media/)).toHaveFocus();
    expect(tab(/Media/)).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(tab('Packages')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Basics')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tab('Packages')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(tab('Basics')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('a');
    expect(tab('Basics')).toHaveFocus();
  });

  it('keeps only the open tab in the tab order', () => {
    render(<Example />);
    expect(tab('Basics')).toHaveAttribute('tabindex', '0');
    expect(tab('Packages')).toHaveAttribute('tabindex', '-1');
  });

  it('marks a flagged tab in words, not only with the icon', () => {
    render(<Example />);
    expect(tab(/^Media\s*\(needs attention\)$/)).toBeInTheDocument();
  });
});

describe('MultiSelect', () => {
  const OPTIONS = [
    { value: 'goa', label: 'Goa Coastal Escape' },
    { value: 'ladakh', label: 'Ladakh High Passes' },
    { value: 'jaipur', label: 'Jaipur Heritage Walk' },
  ];

  function Example({ initial = [], searchable = false }) {
    const [value, setValue] = useState(initial);
    return (
      <>
        <Field label="Linked tours">
          {(control) => (
            <MultiSelect
              {...control}
              options={OPTIONS}
              value={value}
              onChange={setValue}
              searchable={searchable}
              placeholder="Choose tours"
            />
          )}
        </Field>
        <button type="button">Outside</button>
      </>
    );
  }

  const trigger = () => screen.getByRole('button', { name: 'Linked tours' });

  it('shows the placeholder closed, and a checkbox per option when opened', async () => {
    const user = userEvent.setup();
    render(<Example />);

    expect(trigger()).toHaveTextContent('Choose tours');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('adds and removes choices, counting them on the button and listing them below', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(trigger());

    await user.click(screen.getByRole('checkbox', { name: 'Goa Coastal Escape' }));
    await user.click(screen.getByRole('checkbox', { name: 'Jaipur Heritage Walk' }));
    expect(trigger()).toHaveTextContent('2 selected');
    expect(screen.getByRole('checkbox', { name: 'Goa Coastal Escape' })).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Goa Coastal Escape' }));
    expect(trigger()).toHaveTextContent('1 selected');
    expect(screen.getByRole('button', { name: 'Remove Jaipur Heritage Walk' })).toBeInTheDocument();
  });

  it('removes a choice from its chip without opening the list', async () => {
    const user = userEvent.setup();
    render(<Example initial={['goa', 'ladakh']} />);

    await user.click(screen.getByRole('button', { name: 'Remove Goa Coastal Escape' }));

    expect(trigger()).toHaveTextContent('1 selected');
    expect(screen.queryByRole('button', { name: 'Remove Goa Coastal Escape' })).toBeNull();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('narrows the options as you type when searchable', async () => {
    const user = userEvent.setup();
    render(<Example searchable />);
    await user.click(trigger());

    await user.type(screen.getByRole('searchbox', { name: 'Filter options' }), 'LADA');
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByRole('checkbox', { name: 'Ladakh High Passes' })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'x');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText('No matches.')).toBeInTheDocument();
  });

  it('closes on Escape, handing focus back, and on a press outside', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(trigger());
    await user.click(screen.getByRole('checkbox', { name: 'Goa Coastal Escape' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();

    await user.keyboard('{Escape}');
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  const setup = (props) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderApp(
      <ConfirmDialog
        open
        title="Delete Goa Coastal Escape?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      >
        <p>This removes the tour and its images.</p>
      </ConfirmDialog>,
    );
    return { user: userEvent.setup(), onConfirm, onCancel };
  };

  it('names the item, explains, and offers a danger confirm beside Cancel', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Delete Goa Coastal Escape?' });

    expect(dialog).toHaveTextContent('This removes the tour and its images.');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('text-danger');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('confirms and cancels through its buttons, and cancels on Escape', async () => {
    const { user, onConfirm, onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('cannot be dismissed while the action is in flight', async () => {
    const { user, onConfirm, onCancel } = setup({ loading: true });

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows a failure inside the dialog in our own words, and can be a plain confirm', () => {
    setup({
      tone: 'primary',
      confirmLabel: 'Mark completed',
      cancelLabel: 'Not yet',
      error: new ApiError({ status: 409, code: 'INVALID_STATUS_TRANSITION' }),
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      "This booking's status can't be changed that way.",
    );
    expect(screen.getByRole('button', { name: 'Mark completed' })).toHaveClass('bg-primary');
    expect(screen.getByRole('button', { name: 'Not yet' })).toBeInTheDocument();
  });

  it('renders nothing while closed', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('small pieces', () => {
  it('Badge shows its tone, an icon as decoration, and never colour alone', () => {
    render(
      <Badge tone="success" icon={Backpack}>
        Completed
      </Badge>,
    );
    const badge = screen.getByText('Completed');

    expect(badge).toHaveClass('bg-success-tint', 'text-success');
    expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('VerticalChip pairs the vertical’s ink with its name', () => {
    render(<VerticalChip vertical={{ key: 'peakpulse', name: 'PeakPulse' }} />);
    const chip = screen.getByText('PeakPulse');

    expect(chip.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(chip.firstElementChild.style.backgroundColor).toBe('var(--color-accent-peakpulse)');
  });

  it('Avatar shows the photo, and the initial when there is none or it fails', () => {
    const { container, rerender } = render(<Avatar name="aditya" src="https://x.test/a.jpg" />);
    const photo = container.querySelector('img');
    expect(photo).toHaveAttribute('referrerpolicy', 'no-referrer');

    photo.dispatchEvent(new Event('error'));
    rerender(<Avatar name="aditya" src="https://x.test/a.jpg" />);
    expect(container).toHaveTextContent('a');

    rerender(<Avatar name=" " />);
    expect(container).toHaveTextContent('?');
  });

  it('IconButton is named by its label, as a button or as a link', () => {
    renderApp(
      <>
        <IconButton icon={Backpack} label="Open gear" />
        <IconButton icon={Backpack} label="Edit gear" to="/gear/1" variant="outline" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Open gear' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('link', { name: 'Edit gear' })).toHaveAttribute('href', '/gear/1');
  });

  it('EmptyState shows its title, description, icon and action', () => {
    render(
      <EmptyState
        icon={Backpack}
        title="No gear yet."
        description="Add the first item."
        action={<button type="button">Add gear</button>}
        className="py-0"
      />,
    );

    expect(screen.getByRole('heading', { name: 'No gear yet.' })).toBeInTheDocument();
    expect(screen.getByText('Add the first item.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add gear' })).toBeInTheDocument();
  });

  it('ErrorState words the error itself and only offers a retry when given one', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const error = new ApiError({ status: 409, code: 'DUPLICATE' });
    const { rerender } = renderApp(<ErrorState error={error} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something with this name already exists. Try a different name.',
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();

    rerender(null);
    renderApp(<ErrorState error={error} onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledWith();
  });

  it('Spinner announces itself only when it has a label', () => {
    const { rerender } = render(<Spinner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(<Spinner label="Signing you in" />);
    expect(screen.getByRole('status')).toHaveTextContent('Signing you in');
  });
});
