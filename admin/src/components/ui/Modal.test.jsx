import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Modal } from './Modal.jsx';

function Example({ withFields = true }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Book
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Book this trip"
        footer={withFields && <Button onClick={() => setOpen(false)}>Confirm Booking</Button>}
      >
        {withFields ? <Input aria-label="Start date" /> : <p>Nothing to choose.</p>}
      </Modal>
    </>
  );
}

const openModal = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Book' }));
  return screen.getByRole('dialog', { name: 'Book this trip' });
};

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Example />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a labelled modal dialog, moves focus inside and locks page scroll', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const dialog = await openModal(user);

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toContainElement(document.activeElement);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await openModal(user);
    const close = screen.getByRole('button', { name: 'Close' });
    const field = screen.getByRole('textbox', { name: 'Start date' });
    const confirm = screen.getByRole('button', { name: 'Confirm Booking' });

    await user.tab();
    expect(field).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it('holds focus on the only control when there is just one', async () => {
    const user = userEvent.setup();
    render(<Example withFields={false} />);
    await openModal(user);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the opener', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await openModal(user);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes from the close button and restores focus', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await openModal(user);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book' })).toHaveFocus();
  });

  it('closes on a press on the overlay but not on a press inside the panel', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const dialog = await openModal(user);

    await user.click(screen.getByRole('heading', { name: 'Book this trip' }));
    expect(dialog).toBeInTheDocument();

    await user.click(dialog.parentElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('can be a drawer on the left edge, the height of the screen', async () => {
    function Drawer() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Menu
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Sections" placement="left">
            <a href="/tours">Tours</a>
          </Modal>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Drawer />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Sections' });

    expect(drawer).toHaveClass('h-full');
    expect(drawer.parentElement).toHaveClass('justify-start');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
  });
});
