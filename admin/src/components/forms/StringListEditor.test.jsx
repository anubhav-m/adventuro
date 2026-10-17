import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StringListEditor } from './StringListEditor.jsx';

const Harness = ({ initial, onChange = () => {}, ...props }) => {
  const [value, setValue] = useState(initial);
  return (
    <StringListEditor
      label="Top activities"
      itemLabel="Activity"
      addLabel="Add activity"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      {...props}
    />
  );
};

const lines = () => screen.queryAllByRole('textbox').map((input) => input.value);

describe('StringListEditor', () => {
  it('starts empty, adds a line and focuses it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={[]} onChange={onChange} />);

    expect(screen.getByRole('group', { name: 'Top activities' })).toBeInTheDocument();
    expect(screen.getByText('Nothing added yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add activity' }));
    const input = screen.getByRole('textbox', { name: 'Activity 1' });
    expect(input).toHaveFocus();

    await user.type(input, 'Kayaking');
    expect(onChange).toHaveBeenLastCalledWith(['Kayaking']);
  });

  it('adds the next line on Enter in the last line, without submitting a form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Harness initial={['Kayaking']} />
      </form>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Activity 1' }), '{Enter}');

    expect(lines()).toEqual(['Kayaking', '']);
    expect(screen.getByRole('textbox', { name: 'Activity 2' })).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();

    // Enter in a line that is not the last one stays put.
    await user.type(screen.getByRole('textbox', { name: 'Activity 1' }), '{Enter}');
    expect(lines()).toEqual(['Kayaking', '']);
  });

  it('moves and removes lines', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={['One', 'Two', 'Three']} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Move Activity 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Activity 3 down' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Move Activity 3 up' }));
    expect(onChange).toHaveBeenLastCalledWith(['One', 'Three', 'Two']);

    await user.click(screen.getByRole('button', { name: 'Move Activity 1 down' }));
    expect(lines()).toEqual(['Three', 'One', 'Two']);

    await user.click(screen.getByRole('button', { name: 'Remove Activity 2' }));
    expect(lines()).toEqual(['Three', 'Two']);
  });

  it('stops adding at the limit', () => {
    render(<Harness initial={['One', 'Two']} max={2} />);

    expect(screen.getByRole('button', { name: 'Add activity' })).toBeDisabled();
  });

  it('shows the error of each line and of the whole list', () => {
    render(
      <Harness
        initial={['', 'Fine']}
        error={{ message: 'Keep to 30 lines.', 0: { message: 'Keep each line within 300.' } }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Activity 1' })).toHaveAccessibleDescription(
      'Keep each line within 300.',
    );
    expect(screen.getByRole('textbox', { name: 'Activity 2' })).not.toHaveAttribute('aria-invalid');
    const group = screen.getByRole('group', { name: 'Top activities' });
    expect(within(group).getByText('Keep to 30 lines.')).toBeInTheDocument();
  });
});
