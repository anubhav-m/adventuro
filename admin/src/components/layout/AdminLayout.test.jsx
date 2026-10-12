import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';
import { createQueryClient } from '../../lib/queryClient.js';
import { routes } from '../../router.jsx';
import { ADMIN, EMPTY_DASHBOARD } from '../../test/fixtures.js';
import { installGoogleIdentity } from '../../test/googleIdentity.js';
import { currentUrl, renderRoutes } from '../../test/render.jsx';
import { api, failure, record, server, signedInAs, success } from '../../test/server.js';

installGoogleIdentity();

// The routes are lazy, and the dashboard brings the charts with it. Loading the pages once, up
// front, keeps that import out of the first test's waiting time.
beforeAll(
  () =>
    Promise.all([
      import('../../pages/DashboardPage.jsx'),
      import('../../pages/LoginPage.jsx'),
      import('../../pages/NotFoundPage.jsx'),
    ]),
  60_000,
);

// The whole app's routes, signed in as an admin, with an empty dashboard behind them.
const setup = async (path = '/', admin = ADMIN) => {
  signedInAs(admin);
  server.use(http.get(api('/admin/dashboard'), () => success(EMPTY_DASHBOARD)));
  const view = renderRoutes(routes, { path });
  await screen.findByRole('button', { name: 'Sign out' });
  return { user: userEvent.setup(), ...view };
};

const sidebar = () => screen.getByRole('complementary');
const topbar = () => screen.getByRole('button', { name: 'Sign out' }).closest('header');

describe('AdminLayout', () => {
  it('frames the page with the sidebar, the topbar and a skip link', async () => {
    await setup();

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(within(sidebar()).getByRole('link', { name: 'Adventuro Admin home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('lists only the sections that are built, and marks the current one', async () => {
    await setup();
    const nav = within(sidebar()).getByRole('navigation', { name: 'Sections' });
    const links = within(nav).getAllByRole('link');

    expect(links.map((link) => link.textContent)).toEqual(['Dashboard']);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark the dashboard as current on another path', async () => {
    await setup('/no/such/page');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText("We couldn't find what you're looking for.")).toBeInTheDocument();
    expect(within(sidebar()).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('shows who is signed in, falling back to the email when there is no name', async () => {
    const { unmount } = await setup();
    expect(within(topbar()).getByText('Aditya Admin')).toBeInTheDocument();
    unmount();

    await setup('/', { ...ADMIN, name: '' });
    expect(within(topbar()).getByText('aditya@example.com')).toBeInTheDocument();
  });

  it('opens the sections in a drawer from the menu button, and closes it on a choice', async () => {
    const { user } = await setup('/no/such/page');

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Adventuro Admin' });
    expect(within(drawer).getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();

    await user.click(within(drawer).getByRole('link', { name: 'Dashboard' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('closes the drawer on Escape and returns focus to the menu button', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });

  it('signs out to the login page, without the no-access message', async () => {
    const signOuts = record('post', '/auth/logout', () => success());
    const { user, router, queryClient } = await setup();
    await screen.findByText('Total users');

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(signOuts).toHaveLength(1);
    expect(currentUrl(router)).toBe('/login');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(queryClient.getQueryCache().findAll({ queryKey: ['dashboard'] })).toEqual([]);
  });

  it('stays signed in and explains when signing out fails', async () => {
    server.use(http.post(api('/auth/logout'), () => failure(500, 'INTERNAL_ERROR')));
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
    expect(topbar()).toBeInTheDocument();
  });

  it('returns to login when a request finds the session has expired', async () => {
    signedInAs(ADMIN);
    server.use(http.get(api('/admin/dashboard'), () => failure(401, 'UNAUTHENTICATED')));
    const { router } = renderRoutes(routes, { queryClient: createQueryClient() });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    await waitFor(() => expect(currentUrl(router)).toBe('/login'));
  });
});
