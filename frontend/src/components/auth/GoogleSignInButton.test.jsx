import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NETWORK_ERROR } from '../../api/ApiError.js';
import { STORAGE_KEYS } from '../../lib/constants.js';
import { loadGoogleIdentity } from '../../lib/googleIdentity.js';
import { setSystemDark } from '../../test/matchMedia.js';
import { renderApp } from '../../test/render.jsx';
import { ThemeSwitcher } from '../layout/ThemeSwitcher.jsx';
import { GoogleSignInButton } from './GoogleSignInButton.jsx';

vi.mock('../../lib/googleIdentity.js', () => ({
  loadGoogleIdentity: vi.fn(),
  setCredentialHandler: vi.fn(),
}));

const NETWORK_MESSAGE = "We can't reach Adventuro right now. Check your connection and try again.";

const identity = {
  renderButton: vi.fn((element) => {
    element.textContent = 'Continue with Google';
  }),
};

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    identity.renderButton.mockClear();
    loadGoogleIdentity.mockReset();
  });

  it("renders Google's button, matched to the theme, and again when the theme changes", async () => {
    loadGoogleIdentity.mockResolvedValue(identity);
    const user = userEvent.setup();
    renderApp(
      <>
        <ThemeSwitcher />
        <GoogleSignInButton />
      </>,
    );

    expect(await screen.findByText('Continue with Google')).toBeInTheDocument();
    expect(identity.renderButton.mock.calls[0][1]).toMatchObject({
      theme: 'outline',
      shape: 'pill',
    });

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    await waitFor(() => expect(identity.renderButton).toHaveBeenCalledTimes(2));
    expect(identity.renderButton.mock.calls[1][1]).toMatchObject({ theme: 'filled_black' });
  });

  it('uses the dark button when the device is dark', async () => {
    setSystemDark(true);
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'system');
    loadGoogleIdentity.mockResolvedValue(identity);
    renderApp(<GoogleSignInButton />);

    await screen.findByText('Continue with Google');
    expect(identity.renderButton.mock.calls[0][1]).toMatchObject({ theme: 'filled_black' });
  });

  it('explains when Google cannot be reached, and loads it again on Try again', async () => {
    loadGoogleIdentity.mockRejectedValueOnce(new ApiError({ code: NETWORK_ERROR }));
    loadGoogleIdentity.mockResolvedValue(identity);
    const user = userEvent.setup();
    renderApp(<GoogleSignInButton />);

    expect(await screen.findByRole('alert')).toHaveTextContent(NETWORK_MESSAGE);
    expect(identity.renderButton).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Continue with Google')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does nothing with a load that finishes after the button has gone', async () => {
    let finish;
    loadGoogleIdentity.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { unmount } = renderApp(<GoogleSignInButton />);
    unmount();
    await act(async () => finish(identity));

    expect(identity.renderButton).not.toHaveBeenCalled();
  });

  it('ignores a failed load that finishes after the button has gone', async () => {
    let fail;
    loadGoogleIdentity.mockReturnValue(
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
    );
    const { unmount } = renderApp(<GoogleSignInButton />);
    unmount();
    await act(async () => fail(new ApiError({ code: NETWORK_ERROR })));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
