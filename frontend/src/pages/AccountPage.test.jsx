import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../lib/constants.js';
import { routes } from '../router.jsx';
import { CUSTOMER } from '../test/fixtures.js';
import { renderRoutes } from '../test/render.jsx';
import { failure, record, signedInAs, success } from '../test/server.js';

const openAccount = async () => {
  signedInAs(CUSTOMER);
  renderRoutes(routes, { path: '/account' });
  await screen.findByRole('heading', { level: 1, name: 'Your account' });
  return userEvent.setup();
};

const profile = () => within(screen.getByRole('region', { name: 'Profile' }));
const themeChips = () => within(screen.getByRole('group', { name: 'Theme' }));
const nameField = () => profile().getByRole('textbox', { name: 'Full name' });
const phoneField = () => profile().getByRole('textbox', { name: 'Mobile number' });

describe('AccountPage', () => {
  it('shows the profile, the email and the user ID', async () => {
    await openAccount();

    expect(document.title).toBe('Your account · Adventuro');
    expect(screen.getByRole('main')).toHaveTextContent('Signed in as asha@example.com');
    expect(nameField()).toHaveValue('Asha Customer');
    expect(phoneField()).toHaveValue('9876543210');
    expect(profile().getByText(CUSTOMER.id)).toBeInTheDocument();
    expect(profile().queryByRole('status')).not.toBeInTheDocument();
  });

  it('saves an edited name and phone and confirms it', async () => {
    const received = record('patch', '/users/me', (body) =>
      success({ user: { ...CUSTOMER, ...body } }),
    );
    const user = await openAccount();

    await user.clear(nameField());
    await user.type(nameField(), 'Asha Rao');
    await user.clear(phoneField());
    await user.type(phoneField(), '9123456780');
    await user.click(profile().getByRole('button', { name: 'Save changes' }));

    expect(await profile().findByRole('status')).toHaveTextContent('Saved.');
    expect(received).toEqual([{ name: 'Asha Rao', phone: '9123456780' }]);
    expect(nameField()).toHaveValue('Asha Rao');
  });

  it('validates before saving, and shows a taken number on the phone field', async () => {
    const received = record('patch', '/users/me', () => failure(409, 'PHONE_TAKEN'));
    const user = await openAccount();

    await user.clear(phoneField());
    await user.type(phoneField(), '12345');
    await user.click(profile().getByRole('button', { name: 'Save changes' }));
    expect(await profile().findByRole('alert')).toHaveTextContent(
      'Enter a 10-digit Indian mobile number, without +91.',
    );
    expect(received).toEqual([]);

    await user.clear(phoneField());
    await user.type(phoneField(), '9123456780');
    await user.click(profile().getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(profile().getByRole('alert')).toHaveTextContent(
        'This phone number is already linked to another account.',
      ),
    );
    expect(profile().queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the current theme and saves a new choice to the account', async () => {
    const received = record('patch', '/users/me', (body) =>
      success({ user: { ...CUSTOMER, ...body } }),
    );
    const user = await openAccount();
    expect(themeChips().getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(themeChips().getByRole('button', { name: 'Dark' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(themeChips().getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => expect(received).toEqual([{ themePreference: 'dark' }]));
    expect(window.localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
  });

  it('keeps the theme when its own chip is pressed again', async () => {
    const received = record('patch', '/users/me', () => success({ user: CUSTOMER }));
    const user = await openAccount();

    await user.click(themeChips().getByRole('button', { name: 'System' }));

    expect(themeChips().getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(received).toEqual([]);
  });
});
