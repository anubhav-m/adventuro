import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useMe } from '../hooks/queries/useMe.js';
import { STORAGE_KEYS } from '../lib/constants.js';
import { ADMIN } from '../test/fixtures.js';
import { setSystemDark } from '../test/matchMedia.js';
import { renderApp } from '../test/render.jsx';
import { failure, record, signedInAs, success } from '../test/server.js';
import { ThemeSwitcher } from './layout/ThemeSwitcher.jsx';

const appliedTheme = () => document.documentElement.dataset.theme;
const storedTheme = () => window.localStorage.getItem(STORAGE_KEYS.THEME);

function Session() {
  const me = useMe();
  if (me.isPending) return null;
  return <p>{me.data ? 'Signed in' : 'Signed out'}</p>;
}

// The switcher beside a line that shows when the session has loaded.
const setup = () => {
  renderApp(
    <>
      <ThemeSwitcher />
      <Session />
    </>,
  );
  return userEvent.setup();
};

const sessionLoaded = () => screen.findByText('Signed in');
const option = (name) => screen.getByRole('button', { name });
const choose = (user, name) => user.click(option(name));

const savesTo = (themePreference) => (body) =>
  success({ user: { ...ADMIN, themePreference, ...body } });

describe('theme persistence', () => {
  it('offers System, Light and Dark, and starts on System', async () => {
    setup();
    await screen.findByText('Signed out');

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(option('System')).toHaveAttribute('aria-pressed', 'true');
    expect(option('Light')).toHaveAttribute('aria-pressed', 'false');
    expect(option('Dark')).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps the choice in localStorage and never calls the server while signed out', async () => {
    const received = record('patch', '/users/me', () => success({ user: ADMIN }));
    const user = setup();
    await screen.findByText('Signed out');

    await choose(user, 'Dark');

    expect(appliedTheme()).toBe('dark');
    expect(storedTheme()).toBe('dark');
    expect(received).toEqual([]);
  });

  it('saves a signed-in admin’s choice to the server, and mirrors it locally', async () => {
    signedInAs(ADMIN);
    const received = record('patch', '/users/me', savesTo('system'));
    const user = setup();
    await sessionLoaded();

    await choose(user, 'Dark');

    expect(appliedTheme()).toBe('dark');
    await waitFor(() => expect(received).toEqual([{ themePreference: 'dark' }]));
    expect(storedTheme()).toBe('dark');
    await waitFor(() => expect(option('Dark')).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies the choice at once, then rolls it back with a message when saving fails', async () => {
    signedInAs(ADMIN);
    let fail;
    record('patch', '/users/me', async () => {
      await new Promise((resolve) => {
        fail = resolve;
      });
      return failure(500, 'INTERNAL_ERROR');
    });
    const user = setup();
    await sessionLoaded();

    await choose(user, 'Dark');
    await waitFor(() => expect(fail).toBeDefined());
    expect(appliedTheme()).toBe('dark');
    expect(storedTheme()).toBe('dark');

    fail();
    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(appliedTheme()).toBe('light'));
    expect(storedTheme()).toBe('system');
    expect(option('System')).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies the server’s value on sign-in, over the local choice, without saving it back', async () => {
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    signedInAs({ ...ADMIN, themePreference: 'dark' });
    const received = record('patch', '/users/me', savesTo('dark'));
    setup();
    expect(appliedTheme()).toBe('light');

    await sessionLoaded();

    await waitFor(() => expect(appliedTheme()).toBe('dark'));
    expect(storedTheme()).toBe('dark');
    expect(option('Dark')).toHaveAttribute('aria-pressed', 'true');
    expect(received).toEqual([]);
  });

  it('keeps following the device for an admin whose saved choice is system', async () => {
    setSystemDark(true);
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    signedInAs(ADMIN);
    setup();

    await sessionLoaded();

    await waitFor(() => expect(appliedTheme()).toBe('dark'));
    expect(storedTheme()).toBe('system');
  });

  it('keeps the latest of two quick choices', async () => {
    signedInAs(ADMIN);
    const received = record('patch', '/users/me', savesTo('system'));
    const user = setup();
    await sessionLoaded();

    await choose(user, 'Dark');
    await choose(user, 'Light');

    await waitFor(() =>
      expect(received).toEqual([{ themePreference: 'dark' }, { themePreference: 'light' }]),
    );
    await waitFor(() => expect(appliedTheme()).toBe('light'));
    expect(storedTheme()).toBe('light');
  });
});
