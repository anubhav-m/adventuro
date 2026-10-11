import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../lib/constants.js';
import { CUSTOMER } from '../test/fixtures.js';
import { setSystemDark } from '../test/matchMedia.js';
import { renderApp } from '../test/render.jsx';
import { failure, record, signedInAs, success } from '../test/server.js';
import { AccountMenu } from './layout/AccountMenu.jsx';
import { ThemeSwitcher } from './layout/ThemeSwitcher.jsx';

const appliedTheme = () => document.documentElement.dataset.theme;
const storedTheme = () => window.localStorage.getItem(STORAGE_KEYS.THEME);

// The switcher beside the account control, whose state shows when the session has loaded.
const setup = () => {
  renderApp(
    <>
      <ThemeSwitcher />
      <AccountMenu />
    </>,
  );
  return userEvent.setup();
};

const sessionLoaded = () => screen.findByRole('button', { name: 'Account' });

const choose = async (user, current, next) => {
  await user.click(screen.getByRole('button', { name: `Theme: ${current}` }));
  await user.click(screen.getByRole('menuitemradio', { name: next }));
};

const savesTo = (themePreference) => (body) =>
  success({ user: { ...CUSTOMER, themePreference, ...body } });

describe('theme persistence', () => {
  it('keeps a guest’s choice in localStorage and never calls the server', async () => {
    const received = record('patch', '/users/me', () => success({ user: CUSTOMER }));
    const user = setup();
    await screen.findByRole('link', { name: 'Sign in' });

    await choose(user, 'System', 'Dark');

    expect(appliedTheme()).toBe('dark');
    expect(storedTheme()).toBe('dark');
    expect(received).toEqual([]);
  });

  it('saves a signed-in user’s choice to the server, and mirrors it locally', async () => {
    signedInAs(CUSTOMER);
    const received = record('patch', '/users/me', savesTo('system'));
    const user = setup();
    await sessionLoaded();

    await choose(user, 'System', 'Dark');

    expect(appliedTheme()).toBe('dark');
    await waitFor(() => expect(received).toEqual([{ themePreference: 'dark' }]));
    expect(storedTheme()).toBe('dark');
    expect(await screen.findByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies the choice at once, then rolls it back with a message when saving fails', async () => {
    signedInAs(CUSTOMER);
    let fail;
    record('patch', '/users/me', async () => {
      await new Promise((resolve) => {
        fail = resolve;
      });
      return failure(500, 'INTERNAL_ERROR');
    });
    const user = setup();
    await sessionLoaded();

    await choose(user, 'System', 'Dark');
    await waitFor(() => expect(fail).toBeDefined());
    expect(appliedTheme()).toBe('dark');
    expect(storedTheme()).toBe('dark');

    fail();
    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(appliedTheme()).toBe('light'));
    expect(storedTheme()).toBe('system');
    expect(screen.getByRole('button', { name: 'Theme: System' })).toBeInTheDocument();
  });

  it('applies the server’s value on sign-in, over the local choice, without saving it back', async () => {
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    signedInAs({ ...CUSTOMER, themePreference: 'dark' });
    const received = record('patch', '/users/me', savesTo('dark'));
    setup();
    expect(appliedTheme()).toBe('light');

    await sessionLoaded();

    await waitFor(() => expect(appliedTheme()).toBe('dark'));
    expect(storedTheme()).toBe('dark');
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument();
    expect(received).toEqual([]);
  });

  it('keeps following the device for a signed-in user whose saved choice is system', async () => {
    setSystemDark(true);
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    signedInAs(CUSTOMER);
    setup();

    await sessionLoaded();

    await waitFor(() => expect(appliedTheme()).toBe('dark'));
    expect(storedTheme()).toBe('system');
  });

  it('keeps the latest of two quick choices', async () => {
    signedInAs(CUSTOMER);
    const received = record('patch', '/users/me', savesTo('system'));
    const user = setup();
    await sessionLoaded();

    await choose(user, 'System', 'Dark');
    await choose(user, 'Dark', 'Light');

    await waitFor(() =>
      expect(received).toEqual([{ themePreference: 'dark' }, { themePreference: 'light' }]),
    );
    await waitFor(() => expect(appliedTheme()).toBe('light'));
    expect(storedTheme()).toBe('light');
  });
});
