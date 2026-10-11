import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { routes } from '../router.jsx';
import { CUSTOMER, INCOMPLETE_CUSTOMER, mockCatalog } from '../test/fixtures.js';
import { installGoogleIdentity } from '../test/googleIdentity.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, signedInAs, success } from '../test/server.js';

const google = installGoogleIdentity();

const PHONE_MESSAGE = 'Enter a 10-digit Indian mobile number, without +91.';

const openSignIn = async (path) => {
  const view = renderRoutes(routes, { path });
  await screen.findByText('Continue with Google');
  return view;
};

const openOnboarding = async (path = '/onboarding?next=%2Faccount') => {
  signedInAs(INCOMPLETE_CUSTOMER);
  const view = renderRoutes(routes, { path });
  await screen.findByRole('heading', { level: 1, name: 'One last step' });
  return { ...view, user: userEvent.setup() };
};

const phoneField = () => screen.getByRole('textbox', { name: 'Mobile number' });
const save = (user) => user.click(screen.getByRole('button', { name: 'Save and continue' }));

describe('sign-in', () => {
  it('offers Google sign-in under a page title', async () => {
    await openSignIn('/signin');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in to Adventuro' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('Sign in · Adventuro');
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Privacy & Terms' }),
    ).toHaveAttribute('href', '/privacy-terms');
  });

  it('posts the Google credential and sends an incomplete profile to onboarding with next', async () => {
    const received = record('post', '/auth/google', () => success({ user: INCOMPLETE_CUSTOMER }));
    const { router } = await openSignIn('/signin?next=%2Faccount');

    act(() => google.signInWith('google-id-token'));

    expect(await screen.findByRole('heading', { level: 1, name: 'One last step' })).toBeVisible();
    expect(currentUrl(router)).toBe('/onboarding?next=%2Faccount');
    expect(received).toEqual([{ credential: 'google-id-token' }]);
  });

  it('sends a complete profile straight to next', async () => {
    record('post', '/auth/google', () => success({ user: CUSTOMER }));
    const { router } = await openSignIn('/signin?next=%2Faccount');

    act(() => google.signInWith('google-id-token'));

    expect(await screen.findByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    expect(currentUrl(router)).toBe('/account');
  });

  it('sends a complete profile home when there is no next, or next points off-site', async () => {
    mockCatalog();
    record('post', '/auth/google', () => success({ user: CUSTOMER }));
    const { router } = await openSignIn('/signin?next=%2F%2Fevil.example');

    act(() => google.signInWith('google-id-token'));

    await waitFor(() => expect(currentUrl(router)).toBe('/'));
  });

  it('shows the friendly message when Google sign-in is rejected, and stays put', async () => {
    record('post', '/auth/google', () => failure(401, 'INVALID_GOOGLE_TOKEN'));
    const { router } = await openSignIn('/signin?next=%2Faccount');

    act(() => google.signInWith('bad-token'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Google sign-in didn't go through. Please try again.");
    expect(alert).not.toHaveTextContent('Raw server message');
    expect(currentUrl(router)).toBe('/signin?next=%2Faccount');
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('says it is signing in while the credential is being checked', async () => {
    let finish;
    server.use(
      http.post(api('/auth/google'), async () => {
        await new Promise((resolve) => {
          finish = resolve;
        });
        return success({ user: CUSTOMER });
      }),
    );
    await openSignIn('/signin?next=%2Faccount');

    act(() => google.signInWith('google-id-token'));
    expect(await screen.findByText('Signing you in')).toBeInTheDocument();

    finish();
    expect(await screen.findByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
  });

  it('sends someone who is already signed in on their way', async () => {
    signedInAs(CUSTOMER);
    const { router } = renderRoutes(routes, { path: '/signin?next=%2Faccount' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    expect(currentUrl(router)).toBe('/account');
  });
});

describe('guards', () => {
  it('sends a signed-out visitor to sign-in, remembering the page and its query', async () => {
    const { router } = renderRoutes(routes, { path: '/account?tab=theme' });

    await screen.findByRole('heading', { level: 1, name: 'Sign in to Adventuro' });
    expect(currentUrl(router)).toBe('/signin?next=%2Faccount%3Ftab%3Dtheme');
  });

  it('sends a signed-out visitor away from onboarding too', async () => {
    const { router } = renderRoutes(routes, { path: '/onboarding' });

    await screen.findByRole('heading', { level: 1, name: 'Sign in to Adventuro' });
    expect(currentUrl(router)).toBe('/signin?next=%2Fonboarding');
  });

  it('sends an incomplete profile from an account page to onboarding with next', async () => {
    signedInAs(INCOMPLETE_CUSTOMER);
    const { router } = renderRoutes(routes, { path: '/account' });

    await screen.findByRole('heading', { level: 1, name: 'One last step' });
    expect(currentUrl(router)).toBe('/onboarding?next=%2Faccount');
  });

  it('lets a complete profile through', async () => {
    signedInAs(CUSTOMER);
    const { router } = renderRoutes(routes, { path: '/account' });

    await screen.findByRole('heading', { level: 1, name: 'Your account' });
    expect(currentUrl(router)).toBe('/account');
  });

  it('offers a retry instead of a redirect when the session cannot be checked', async () => {
    server.use(http.get(api('/auth/me'), () => HttpResponse.error()));
    const { router } = renderRoutes(routes, { path: '/account' });
    const user = userEvent.setup();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We can't reach Adventuro right now. Check your connection and try again.",
    );
    expect(currentUrl(router)).toBe('/account');

    signedInAs(CUSTOMER);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
  });
});

describe('onboarding', () => {
  it('prefills the name from Google and leaves the phone empty', async () => {
    await openOnboarding();

    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('Ira Incomplete');
    expect(phoneField()).toHaveValue('');
    expect(phoneField()).toHaveAccessibleDescription(
      '10 digits, without +91. We use it only for your bookings.',
    );
    expect(document.title).toBe('Complete your profile · Adventuro');
  });

  it.each([
    ['nothing', ''],
    ['too few digits', '98765'],
    ['a number that does not start with 6 to 9', '1234567890'],
    ['letters', '98765abcde'],
  ])('rejects %s as a phone number without calling the API', async (_label, phone) => {
    const received = record('patch', '/users/me', () => success({ user: CUSTOMER }));
    const { user } = await openOnboarding();

    if (phone) await user.type(phoneField(), phone);
    await save(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(PHONE_MESSAGE);
    expect(phoneField()).toBeInvalid();
    expect(received).toEqual([]);
  });

  it('asks for a name when it is cleared', async () => {
    const received = record('patch', '/users/me', () => success({ user: CUSTOMER }));
    const { user } = await openOnboarding();

    await user.clear(screen.getByRole('textbox', { name: 'Full name' }));
    await user.type(phoneField(), '9123456780');
    await save(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your name.');
    expect(received).toEqual([]);
  });

  it('shows a taken phone number on the phone field', async () => {
    record('patch', '/users/me', () => failure(409, 'PHONE_TAKEN'));
    const { user, router } = await openOnboarding();

    await user.type(phoneField(), '9876543210');
    await save(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This phone number is already linked to another account.');
    expect(phoneField()).toBeInvalid();
    expect(phoneField()).toHaveAccessibleDescription(
      'This phone number is already linked to another account.',
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(currentUrl(router)).toBe('/onboarding?next=%2Faccount');
  });

  it('shows our own wording on a field the server rejects', async () => {
    record('patch', '/users/me', () =>
      failure(400, 'VALIDATION_ERROR', { errors: [{ field: 'name', message: 'name too odd' }] }),
    );
    const { user } = await openOnboarding();

    await user.type(phoneField(), '9123456780');
    await save(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Enter your name.');
    expect(alert).not.toHaveTextContent('name too odd');
    expect(screen.getByRole('textbox', { name: 'Full name' })).toBeInvalid();
  });

  it('shows any other failure under the form, in our own words', async () => {
    record('patch', '/users/me', () => failure(500, 'INTERNAL_ERROR'));
    const { user } = await openOnboarding();

    await user.type(phoneField(), '9123456780');
    await save(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong on our side. Please try again in a moment.',
    );
    expect(phoneField()).toBeValid();
  });

  it('saves the trimmed name and phone, then goes on to next', async () => {
    const received = record('patch', '/users/me', (body) =>
      success({ user: { ...INCOMPLETE_CUSTOMER, ...body, profileComplete: true } }),
    );
    const { user, router } = await openOnboarding();

    await user.type(screen.getByRole('textbox', { name: 'Full name' }), ' Rao  ');
    await user.type(phoneField(), '9123456780');
    await save(user);

    expect(await screen.findByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    expect(currentUrl(router)).toBe('/account');
    expect(received).toEqual([{ name: 'Ira Incomplete Rao', phone: '9123456780' }]);
    expect(screen.getByRole('textbox', { name: 'Mobile number' })).toHaveValue('9123456780');
  });

  it('goes home after saving when there is no next', async () => {
    mockCatalog();
    record('patch', '/users/me', (body) =>
      success({ user: { ...INCOMPLETE_CUSTOMER, ...body, profileComplete: true } }),
    );
    const { user, router } = await openOnboarding('/onboarding');

    await user.type(phoneField(), '9123456780');
    await save(user);

    await waitFor(() => expect(currentUrl(router)).toBe('/'));
  });

  it('skips onboarding for a profile that is already complete', async () => {
    signedInAs(CUSTOMER);
    const { router } = renderRoutes(routes, { path: '/onboarding?next=%2Faccount' });

    await screen.findByRole('heading', { level: 1, name: 'Your account' });
    expect(currentUrl(router)).toBe('/account');
  });
});
