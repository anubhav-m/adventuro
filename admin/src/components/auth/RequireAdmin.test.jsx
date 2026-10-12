import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { LoginPage } from '../../pages/LoginPage.jsx';
import { ADMIN, CUSTOMER } from '../../test/fixtures.js';
import { installGoogleIdentity } from '../../test/googleIdentity.js';
import { currentUrl, renderRoutes } from '../../test/render.jsx';
import { api, failure, record, server, signedInAs, success } from '../../test/server.js';
import { RequireAdmin } from './RequireAdmin.jsx';

installGoogleIdentity();

const NO_ACCESS = "This account doesn't have admin access.";

const ROUTES = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [{ path: '*', element: <h1>Admin content</h1> }],
  },
];

const renderGuarded = (path = '/') => renderRoutes(ROUTES, { path });

describe('RequireAdmin', () => {
  it('sends a visitor with no session (401) to the login page, without a message', async () => {
    const { router } = renderGuarded('/bookings');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/login');
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('signs a non-admin out and sends them to login with the no-access message', async () => {
    signedInAs(CUSTOMER);
    const signOuts = record('post', '/auth/logout', () => success());
    const { router } = renderGuarded();

    expect(await screen.findByRole('alert')).toHaveTextContent(NO_ACCESS);
    expect(signOuts).toHaveLength(1);
    expect(currentUrl(router)).toBe('/login');
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('never shows the content to a non-admin, even while the sign-out is in flight', async () => {
    signedInAs(CUSTOMER);
    let finish;
    record('post', '/auth/logout', async () => {
      await new Promise((resolve) => {
        finish = resolve;
      });
      return success();
    });
    renderGuarded();

    await waitFor(() => expect(finish).toBeDefined());
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();

    finish();
    expect(await screen.findByRole('alert')).toHaveTextContent(NO_ACCESS);
  });

  it('keeps a non-admin out when the sign-out fails, and tries again on request', async () => {
    signedInAs(CUSTOMER);
    server.use(http.post(api('/auth/logout'), () => failure(500, 'INTERNAL_ERROR')));
    const user = userEvent.setup();
    renderGuarded();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong on our side. Please try again in a moment.',
    );
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();

    server.use(http.post(api('/auth/logout'), () => success()));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(NO_ACCESS);
  });

  it('shows the content to an admin', async () => {
    signedInAs(ADMIN);
    const { router } = renderGuarded('/bookings?status=confirmed');

    expect(await screen.findByRole('heading', { name: 'Admin content' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/bookings?status=confirmed');
  });

  it('shows an error with a retry when the session cannot be read', async () => {
    server.use(http.get(api('/auth/me'), () => failure(500, 'INTERNAL_ERROR')));
    const user = userEvent.setup();
    renderGuarded();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();

    signedInAs(ADMIN);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Admin content' })).toBeInTheDocument();
  });
});
