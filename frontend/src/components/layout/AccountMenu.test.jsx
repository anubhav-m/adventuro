import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '../../api/queryKeys.js';
import { routes } from '../../router.jsx';
import { CUSTOMER, INCOMPLETE_CUSTOMER, mockCatalog } from '../../test/fixtures.js';
import { currentUrl, renderRoutes } from '../../test/render.jsx';
import { api, failure, record, server, signedInAs, success } from '../../test/server.js';

const navbar = () => within(screen.getByRole('navigation', { name: 'Main' }));
// The layout appears once the first route's code has loaded.
const shell = () => screen.findByRole('navigation', { name: 'Main' });

// Opens the app on the account page as `account` and opens the account menu.
const openMenu = async (account = CUSTOMER, path = '/account') => {
  signedInAs(account);
  mockCatalog();
  const view = renderRoutes(routes, { path });
  const user = userEvent.setup();
  await shell();
  await user.click(await navbar().findByRole('button', { name: 'Account' }));
  return { ...view, user, menu: screen.getByRole('menu', { name: 'Account' }) };
};

describe('AccountMenu', () => {
  it('is a Sign in link for a signed-out visitor', async () => {
    renderRoutes(routes, { path: '/nowhere' });
    await shell();

    expect(await navbar().findByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/signin',
    );
    expect(navbar().queryByRole('button', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('shows neither control until the session is known', async () => {
    server.use(http.get(api('/auth/me'), () => new Promise(() => {})));
    renderRoutes(routes, { path: '/nowhere' });
    await shell();

    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('shows who is signed in and the account links', async () => {
    const { menu } = await openMenu();
    const panel = within(menu.parentElement);

    expect(navbar().queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(panel.getByText('Asha Customer')).toBeInTheDocument();
    expect(panel.getByText('asha@example.com')).toBeInTheDocument();
    expect(panel.getByText('+91 9876543210')).toBeInTheDocument();
    expect(panel.getByText(CUSTOMER.id)).toBeInTheDocument();

    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['My Bookings', 'Profile', 'Copy user ID', 'Sign out']);
    expect(within(menu).getByRole('menuitem', { name: 'My Bookings' })).toHaveAttribute(
      'href',
      '/account/bookings',
    );
    expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('says so when the profile has no phone or name yet', async () => {
    const { menu } = await openMenu({ ...INCOMPLETE_CUSTOMER, name: '' }, '/onboarding');
    const panel = within(menu.parentElement);

    expect(panel.getByText('Not added yet')).toBeInTheDocument();
    expect(panel.getByText('New traveler')).toBeInTheDocument();
  });

  it("shows the Google photo, and the initial when there is none or it won't load", async () => {
    signedInAs({ ...CUSTOMER, avatarUrl: 'https://photos.example.com/asha.jpg' });
    renderRoutes(routes, { path: '/account' });
    await shell();
    const button = await navbar().findByRole('button', { name: 'Account' });
    const photo = button.querySelector('img');

    expect(photo).toHaveAttribute('src', 'https://photos.example.com/asha.jpg');
    expect(photo).toHaveAttribute('referrerpolicy', 'no-referrer');

    fireEvent.error(photo);
    expect(button.querySelector('img')).not.toBeInTheDocument();
    expect(button).toHaveTextContent('A');
  });

  it('copies the user ID and confirms it', async () => {
    const { user, menu } = await openMenu();

    await user.click(within(menu).getByRole('menuitem', { name: 'Copy user ID' }));

    expect(await screen.findByText('User ID copied')).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(CUSTOMER.id);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('says so in our own words when the clipboard refuses', async () => {
    const { user, menu } = await openMenu();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('NotAllowedError'));

    await user.click(within(menu).getByRole('menuitem', { name: 'Copy user ID' }));

    expect(await screen.findByText("Something didn't work. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText('NotAllowedError')).not.toBeInTheDocument();
  });

  it('signs out: back on the home page, signed out, with the user’s cached data gone', async () => {
    const received = record('post', '/auth/logout', () => success());
    const { user, menu, router, queryClient } = await openMenu();
    const bookingsKey = queryKeys.bookings.mine({ page: 1 });
    queryClient.setQueryData(bookingsKey, { bookings: [{ bookingNumber: 'ADV-TT-2026-000001' }] });

    await user.click(within(menu).getByRole('menuitem', { name: 'Sign out' }));

    expect(await navbar().findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/');
    expect(await screen.findByText('Signed out')).toBeInTheDocument();
    expect(received).toHaveLength(1);
    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
    expect(queryClient.getQueryData(bookingsKey)).toBeUndefined();
    expect(navbar().queryByRole('button', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('stays signed in and explains when signing out fails', async () => {
    record('post', '/auth/logout', () => failure(500, 'INTERNAL_ERROR'));
    const { user, menu, queryClient } = await openMenu();

    await user.click(within(menu).getByRole('menuitem', { name: 'Sign out' }));

    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(queryClient.getQueryData(queryKeys.me)).toEqual(CUSTOMER));
    expect(navbar().getByRole('button', { name: 'Account' })).toBeInTheDocument();
  });
});
