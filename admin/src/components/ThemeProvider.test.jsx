import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useTheme } from '../hooks/useTheme.js';
import { STORAGE_KEYS } from '../lib/constants.js';
import { renderApp } from '../test/render.jsx';
import { setSystemDark } from '../test/matchMedia.js';
import { ThemeSwitcher } from './layout/ThemeSwitcher.jsx';

const appliedTheme = () => document.documentElement.dataset.theme;
const storedTheme = () => window.localStorage.getItem(STORAGE_KEYS.THEME);

function Probe() {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <>
      <p>
        {preference}/{resolved}
      </p>
      <button type="button" onClick={() => setPreference('light', { notify: false })}>
        Apply server value
      </button>
      <button type="button" onClick={() => setPreference('sepia')}>
        Apply nonsense
      </button>
      <button type="button" onClick={() => setPreference('light')}>
        Choose light
      </button>
    </>
  );
}

const choose = (user, name) => user.click(screen.getByRole('button', { name }));

describe('ThemeProvider', () => {
  it('defaults to system and resolves it from the OS setting', () => {
    setSystemDark(true);
    renderApp(<Probe />);

    expect(screen.getByText('system/dark')).toBeInTheDocument();
    expect(appliedTheme()).toBe('dark');
    expect(storedTheme()).toBeNull();
  });

  it('follows the OS setting when it changes while on system', () => {
    renderApp(<Probe />);
    expect(appliedTheme()).toBe('light');

    act(() => setSystemDark(true));
    expect(appliedTheme()).toBe('dark');
    expect(screen.getByText('system/dark')).toBeInTheDocument();

    act(() => setSystemDark(false));
    expect(appliedTheme()).toBe('light');
  });

  it('starts from the choice saved in localStorage, whatever the OS says', () => {
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    setSystemDark(true);
    renderApp(<Probe />);

    expect(screen.getByText('light/light')).toBeInTheDocument();
    expect(appliedTheme()).toBe('light');

    act(() => setSystemDark(false));
    act(() => setSystemDark(true));
    expect(appliedTheme()).toBe('light');
  });

  it('ignores a saved value that is not a theme', () => {
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'sepia');
    renderApp(<Probe />);
    expect(screen.getByText('system/light')).toBeInTheDocument();
  });

  it('applies a choice, saves it to localStorage and reports it with the previous one', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    renderApp(
      <>
        <ThemeSwitcher />
        <Probe />
      </>,
      { onThemeChange },
    );

    await choose(user, 'Dark');
    expect(appliedTheme()).toBe('dark');
    expect(storedTheme()).toBe('dark');
    expect(screen.getByText('dark/dark')).toBeInTheDocument();
    expect(onThemeChange).toHaveBeenLastCalledWith('dark', 'system');

    await choose(user, 'Light');
    expect(appliedTheme()).toBe('light');
    expect(storedTheme()).toBe('light');
    expect(onThemeChange).toHaveBeenLastCalledWith('light', 'dark');
    expect(onThemeChange).toHaveBeenCalledTimes(2);
  });

  it('can go back to following the device after a choice', async () => {
    const user = userEvent.setup();
    setSystemDark(true);
    renderApp(
      <>
        <ThemeSwitcher />
        <Probe />
      </>,
    );

    await choose(user, 'Light');
    expect(screen.getByText('light/light')).toBeInTheDocument();
    expect(storedTheme()).toBe('light');

    await choose(user, 'System');
    expect(screen.getByText('system/dark')).toBeInTheDocument();
    expect(storedTheme()).toBe('system');
    expect(appliedTheme()).toBe('dark');
  });

  it('does not report choosing the theme that is already set', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    renderApp(<Probe />, { onThemeChange });

    await user.click(screen.getByRole('button', { name: 'Choose light' }));
    expect(onThemeChange).not.toHaveBeenCalled();
  });

  it('can apply a value without reporting it, and rejects an unknown one', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    setSystemDark(true);
    renderApp(<Probe />, { onThemeChange });

    await user.click(screen.getByRole('button', { name: 'Apply server value' }));
    expect(screen.getByText('light/light')).toBeInTheDocument();
    expect(storedTheme()).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Apply nonsense' }));
    expect(screen.getByText('light/light')).toBeInTheDocument();
    expect(onThemeChange).not.toHaveBeenCalled();
  });

  it('refuses to be used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useTheme must be used inside ThemeProvider');
    consoleError.mockRestore();
  });
});
