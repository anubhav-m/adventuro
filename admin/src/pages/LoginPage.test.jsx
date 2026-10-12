import { act, screen, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { ADMIN, CUSTOMER } from '../test/fixtures.js';
import { installGoogleIdentity } from '../test/googleIdentity.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, signedInAs, success } from '../test/server.js';
import { LoginPage } from './LoginPage.jsx';

const google = installGoogleIdentity();

const NO_ACCESS = "This account doesn't have admin access.";

const ROUTES = [
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <h1>Dashboard</h1> },
];

const renderLogin = () => renderRoutes(ROUTES, { path: '/login' });

const signInWith = (credential) => act(() => google.signInWith(credential));

describe('LoginPage', () => {
  it('shows the Google button to a signed-out visitor and sets the page title', async () => {
    renderLogin();

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(await screen.findByText('Continue with Google')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Sign in · Adventuro Admin'));
  });

  it('signs an admin in with the Google credential and opens the dashboard', async () => {
    const received = record('post', '/auth/google', () => success({ user: ADMIN }));
    const { router } = renderLogin();
    await screen.findByText('Continue with Google');

    await signInWith('google-id-token');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(received).toEqual([{ credential: 'google-id-token' }]);
    expect(currentUrl(router)).toBe('/');
  });

  it('signs a non-admin straight out again and shows the no-access message', async () => {
    record('post', '/auth/google', () => success({ user: CUSTOMER }));
    const signOuts = record('post', '/auth/logout', () => success());
    const { router } = renderLogin();
    await screen.findByText('Continue with Google');

    await signInWith('customer-id-token');

    expect(await screen.findByRole('alert')).toHaveTextContent(NO_ACCESS);
    expect(signOuts).toHaveLength(1);
    expect(currentUrl(router)).toBe('/login');
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('shows our own text when Google’s credential is rejected', async () => {
    server.use(http.post(api('/auth/google'), () => failure(401, 'INVALID_GOOGLE_TOKEN')));
    renderLogin();
    await screen.findByText('Continue with Google');

    await signInWith('bad-token');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Google sign-in didn't go through. Please try again.");
    expect(alert).not.toHaveTextContent('Raw server message');
  });

  it('sends an admin who is already signed in straight to the dashboard', async () => {
    signedInAs(ADMIN);
    const { router } = renderLogin();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/');
  });

  it('signs out a non-admin who arrives with a session, and says why', async () => {
    signedInAs(CUSTOMER);
    const signOuts = record('post', '/auth/logout', () => success());
    renderLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent(NO_ACCESS);
    expect(signOuts).toHaveLength(1);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });
});
