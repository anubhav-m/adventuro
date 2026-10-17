import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { UnsavedChangesDialog } from '../components/forms/UnsavedChangesDialog.jsx';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { useUnsavedChanges } from './useUnsavedChanges.js';

// A page with something to change, a link away, a link to another tab of the same page, and a
// save that leaves on purpose.
function EditorPage() {
  const [isDirty, setDirty] = useState(false);
  const { blocker, allowNavigation } = useUnsavedChanges(isDirty);
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => setDirty(true)}>
        Change something
      </button>
      <Link to="/elsewhere">Leave</Link>
      <Link to="/editor?tab=media">Media tab</Link>
      <button
        type="button"
        onClick={() => {
          allowNavigation();
          navigate('/saved');
        }}
      >
        Save and go
      </button>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

const routes = [
  { path: '/editor', element: <EditorPage /> },
  { path: '/elsewhere', element: <h1>Elsewhere</h1> },
  { path: '/saved', element: <h1>Saved</h1> },
];

const setup = () => ({ user: userEvent.setup(), ...renderRoutes(routes, { path: '/editor' }) });

const fireBeforeUnload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe('useUnsavedChanges', () => {
  it('lets a clean page go without asking', async () => {
    const { user } = setup();

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
    await user.click(screen.getByRole('link', { name: 'Leave' }));

    expect(await screen.findByRole('heading', { name: 'Elsewhere' })).toBeInTheDocument();
  });

  it('asks before leaving with changes, and stays on Keep editing', async () => {
    const { user, router } = setup();
    await user.click(screen.getByRole('button', { name: 'Change something' }));

    await user.click(screen.getByRole('link', { name: 'Leave' }));
    const dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' });
    expect(dialog).toHaveTextContent('The changes you made on this page will be lost.');

    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(currentUrl(router)).toBe('/editor');
  });

  it('leaves when the admin chooses to', async () => {
    const { user, router } = setup();
    await user.click(screen.getByRole('button', { name: 'Change something' }));

    await user.click(screen.getByRole('link', { name: 'Leave' }));
    await user.click(await screen.findByRole('button', { name: 'Leave' }));

    expect(await screen.findByRole('heading', { name: 'Elsewhere' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/elsewhere');
  });

  it('does not count a change of tab as leaving', async () => {
    const { user, router } = setup();
    await user.click(screen.getByRole('button', { name: 'Change something' }));

    await user.click(screen.getByRole('link', { name: 'Media tab' }));

    expect(currentUrl(router)).toBe('/editor?tab=media');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lets a save leave on purpose', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Change something' }));

    await user.click(screen.getByRole('button', { name: 'Save and go' }));

    expect(await screen.findByRole('heading', { name: 'Saved' })).toBeInTheDocument();
  });

  it('asks the browser to confirm closing the tab only while there are changes', async () => {
    const { user, unmount } = setup();
    await user.click(screen.getByRole('button', { name: 'Change something' }));

    expect(fireBeforeUnload().defaultPrevented).toBe(true);
    unmount();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});
