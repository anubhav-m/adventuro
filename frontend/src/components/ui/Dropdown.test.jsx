import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render.jsx';
import { Dropdown } from './Dropdown.jsx';

const setup = (items) => {
  const onSelect = vi.fn();
  const menuItems = items ?? [
    { key: 'bookings', label: 'My Bookings', to: '/account/bookings' },
    { key: 'profile', label: 'Profile', onSelect: () => onSelect('profile') },
    { key: 'signout', label: 'Sign out', onSelect: () => onSelect('signout') },
  ];
  const view = renderApp(
    <>
      <Dropdown
        label="Account"
        items={menuItems}
        trigger={(props) => (
          <button type="button" {...props}>
            Account
          </button>
        )}
      />
      <button type="button">Elsewhere</button>
    </>,
  );
  return { ...view, onSelect, user: userEvent.setup() };
};

const trigger = () => screen.getByRole('button', { name: 'Account' });

describe('Dropdown', () => {
  it('is a collapsed menu button until opened', () => {
    setup();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on click, points the button at the menu and focuses the first item', async () => {
    const { user } = setup();
    await user.click(trigger());
    const menu = screen.getByRole('menu', { name: 'Account' });

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', menu.id);
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByRole('menuitem', { name: 'My Bookings' })).toHaveFocus();
  });

  it('opens with Enter, Space and ArrowDown from the keyboard', async () => {
    const { user } = setup();
    for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
      trigger().focus();
      await user.keyboard(key);
      expect(screen.getByRole('menuitem', { name: 'My Bookings' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    }
  });

  it('moves between items with the arrow keys, Home and End, wrapping at the ends', async () => {
    const { user } = setup();
    await user.click(trigger());

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'My Bookings' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'My Bookings' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the button', async () => {
    const { user } = setup();
    await user.click(trigger());
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it('runs the item, closes and returns focus when an item is chosen', async () => {
    const { user, onSelect } = setup();
    await user.click(trigger());
    await user.keyboard('{End}{Enter}');

    expect(onSelect).toHaveBeenCalledWith('signout');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it('follows a link item and closes', async () => {
    const { user, router } = setup();
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: 'My Bookings' }));

    expect(router.state.location.pathname).toBe('/account/bookings');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Tab, on a press outside, and on a second click of the button', async () => {
    const { user } = setup();
    await user.click(trigger());
    await user.tab();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(trigger());
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(trigger());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('becomes a single-choice menu when items carry `selected`, starting on the chosen one', async () => {
    const { user } = setup([
      { key: 'system', label: 'System', selected: false },
      { key: 'light', label: 'Light', selected: false },
      { key: 'dark', label: 'Dark', selected: true },
    ]);
    await user.click(trigger());

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).not.toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toHaveFocus();
  });
});
