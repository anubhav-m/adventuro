import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render.jsx';
import { LogoMenu } from './LogoMenu.jsx';

const VERTICAL_NAMES = [
  'TideTrail',
  'GoldenSaga',
  'PeakPulse',
  'EliteScape',
  'UrbanEcho',
  'Grand India Tour',
];

const setup = (path) => {
  const view = renderApp(
    <>
      <LogoMenu />
      <button type="button">Elsewhere</button>
    </>,
    { path },
  );
  return { ...view, user: userEvent.setup() };
};

const menuButton = () => screen.getByRole('button', { name: 'Browse verticals' });
const item = (name) => screen.getByRole('menuitem', { name });

describe('LogoMenu', () => {
  it('links the wordmark home and starts as a collapsed menu button', () => {
    setup('/gear');

    expect(screen.getByRole('link', { name: 'Adventuro home' })).toHaveAttribute('href', '/');
    expect(menuButton()).toHaveAttribute('aria-haspopup', 'menu');
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton()).not.toHaveAttribute('aria-controls');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on hover with the six verticals and the nav links, and closes when the pointer leaves', async () => {
    const { user } = setup();
    await user.hover(screen.getByRole('link', { name: 'Adventuro home' }));
    const menu = screen.getByRole('menu', { name: 'Verticals' });

    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    expect(menuButton()).toHaveAttribute('aria-controls', menu.id);
    const names = within(menu)
      .getAllByRole('menuitem')
      .map((element) => element.textContent);
    expect(names).toEqual([...VERTICAL_NAMES, 'Gear Store', 'About Us']);
    expect(item('TideTrail')).toHaveAttribute('href', '/v/tidetrail');
    expect(item('TideTrail')).toHaveAttribute('data-vertical', 'tidetrail');
    expect(item('Grand India Tour')).toHaveAttribute('href', '/v/grand-india-tour');
    expect(item('Gear Store')).toHaveAttribute('href', '/gear');

    await user.unhover(screen.getByRole('link', { name: 'Adventuro home' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('stays open while the pointer moves from the logo into the menu', async () => {
    const { user } = setup();
    await user.hover(menuButton());
    await user.hover(item('PeakPulse'));
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('opens with Enter from the keyboard and focuses the first item', async () => {
    const { user } = setup();
    await user.tab();
    await user.tab();
    expect(menuButton()).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(item('TideTrail')).toHaveFocus();
  });

  it('opens with ArrowDown and with Space as well', async () => {
    const { user } = setup();
    for (const key of ['{ArrowDown}', ' ']) {
      menuButton().focus();
      await user.keyboard(key);
      expect(item('TideTrail')).toHaveFocus();
      await user.keyboard('{Escape}');
    }
  });

  it('moves through the items with the arrow keys, Home and End', async () => {
    const { user } = setup();
    menuButton().focus();
    await user.keyboard('{Enter}');

    await user.keyboard('{ArrowDown}');
    expect(item('GoldenSaga')).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(item('About Us')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item('TideTrail')).toHaveFocus();
    await user.keyboard('{End}');
    expect(item('About Us')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('TideTrail')).toHaveFocus();
  });

  it('closes on Escape, returns focus to the button and stays closed', async () => {
    const { user } = setup();
    menuButton().focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens on a mouse click and stays open, since hovering had already opened it', async () => {
    const { user } = setup();
    await user.click(menuButton());
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(menuButton());
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('toggles on tap, and closes on a press outside', async () => {
    const { user } = setup();
    await user.pointer({ keys: '[TouchA]', target: menuButton() });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.pointer({
      keys: '[TouchA]',
      target: screen.getByRole('button', { name: 'Elsewhere' }),
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.pointer({ keys: '[TouchA]', target: menuButton() });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.pointer({ keys: '[TouchA]', target: menuButton() });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes when focus leaves it', async () => {
    const { user } = setup();
    menuButton().focus();
    await user.keyboard('{Enter}');
    await user.tab();

    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('navigates and closes when an item is chosen', async () => {
    const { user, router } = setup();
    await user.click(menuButton());
    await user.click(item('UrbanEcho'));

    expect(router.state.location.pathname).toBe('/v/urbanecho');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on any route change', async () => {
    const { user, router } = setup();
    await user.click(menuButton());
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await act(() => router.navigate('/about'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });
});
