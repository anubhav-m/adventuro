import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useUploadSession } from '../../hooks/useUploadSession.js';
import { renderApp } from '../../test/render.jsx';
import { api, failure, record, server, success } from '../../test/server.js';
import { ImageUploader } from './ImageUploader.jsx';

const SAVED = { url: 'https://cdn.example.com/tours/saved.jpg', path: 'tours/saved.jpg' };
const uploaded = (name) => ({
  url: `https://cdn.example.com/tours/${name}.png`,
  path: `tours/${name}.png`,
});

const png = (name = 'cover.png', bytes = 8) =>
  new File([new Uint8Array(bytes)], name, { type: 'image/png' });

// The uploader with its own session, as an editor page holds it. `commit` stands for a save.
const Harness = ({ initial = null, onChange = () => {}, commitRef }) => {
  const session = useUploadSession();
  const [value, setValue] = useState(initial);
  if (commitRef) commitRef.current = session.commit;
  return (
    <ImageUploader
      label="Cover image"
      value={value}
      folder="tours"
      session={session}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

// Answers each upload with the next image in `images`, and counts the requests.
const serveUploads = (...images) => {
  const seen = [];
  server.use(
    http.post(api('/admin/uploads'), ({ request }) => {
      seen.push(new URL(request.url).searchParams.get('folder'));
      return success({ image: images[seen.length - 1] }, { status: 201 });
    }),
  );
  return seen;
};

const recordDeletes = () => record('delete', '/admin/uploads', () => success());

const fileInput = () => screen.getByLabelText('Cover image: choose a file');

describe('ImageUploader', () => {
  it('refuses a file that is not a JPG, PNG or WebP without sending it', async () => {
    // The input's own `accept` filter is skipped, as a drag from the desktop would skip it.
    const user = userEvent.setup({ applyAccept: false });
    const uploads = serveUploads(uploaded('never'));
    const onChange = vi.fn();
    renderApp(<Harness onChange={onChange} />);

    await user.upload(fileInput(), new File(['gif'], 'cover.gif', { type: 'image/gif' }));

    expect(await screen.findByText('Please upload a JPG, PNG or WebP image.')).toBeInTheDocument();
    expect(uploads).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('refuses a file over 5 MB without sending it', async () => {
    const user = userEvent.setup();
    const uploads = serveUploads(uploaded('never'));
    renderApp(<Harness />);

    await user.upload(fileInput(), png('huge.png', 5 * 1024 * 1024 + 1));

    expect(
      await screen.findByText('That image is too large. The limit is 5 MB.'),
    ).toBeInTheDocument();
    expect(uploads).toEqual([]);
  });

  it('uploads to its folder and previews the image', async () => {
    const user = userEvent.setup();
    const uploads = serveUploads(uploaded('a'));
    const deletes = recordDeletes();
    const onChange = vi.fn();
    const { unmount } = renderApp(<Harness onChange={onChange} />);

    expect(fileInput()).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
    await user.upload(fileInput(), png());

    const preview = await screen.findByRole('img', { name: 'Cover image, current image' });
    expect(preview).toHaveAttribute('src', uploaded('a').url);
    expect(uploads).toEqual(['tours']);
    expect(onChange).toHaveBeenCalledWith(uploaded('a'));

    // Never saved, so leaving deletes it (see the tests below).
    unmount();
    await waitFor(() => expect(deletes).toEqual([{ path: 'tours/a.png' }]));
  });

  it('deletes an unsaved upload from storage when it is removed', async () => {
    const user = userEvent.setup();
    serveUploads(uploaded('a'));
    const deletes = recordDeletes();
    const onChange = vi.fn();
    renderApp(<Harness onChange={onChange} />);

    await user.upload(fileInput(), png());
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(deletes).toEqual([{ path: 'tours/a.png' }]));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeInTheDocument();
  });

  it('leaves a saved image to the server when it is removed', async () => {
    const user = userEvent.setup();
    const deletes = recordDeletes();
    renderApp(<Harness initial={SAVED} />);

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.getByRole('button', { name: 'Upload image' })).toBeInTheDocument();
    expect(deletes).toEqual([]);
  });

  it('deletes the unsaved image it replaces', async () => {
    const user = userEvent.setup();
    serveUploads(uploaded('a'), uploaded('b'));
    const deletes = recordDeletes();
    const { unmount } = renderApp(<Harness initial={SAVED} />);

    // Replacing the saved image deletes nothing: the server cleans it up on save.
    await user.upload(fileInput(), png());
    expect(await screen.findByRole('img')).toHaveAttribute('src', uploaded('a').url);
    await user.upload(fileInput(), png());

    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', uploaded('b').url));
    await waitFor(() => expect(deletes).toEqual([{ path: 'tours/a.png' }]));

    unmount();
    await waitFor(() => expect(deletes).toHaveLength(2));
  });

  it('shows why the server refused the upload, in our words', async () => {
    const user = userEvent.setup();
    server.use(http.post(api('/admin/uploads'), () => failure(400, 'INVALID_FILE')));
    renderApp(<Harness />);

    await user.upload(fileInput(), png());

    expect(await screen.findByText('Please upload a JPG, PNG or WebP image.')).toBeInTheDocument();
    expect(screen.queryByText('Raw server message')).not.toBeInTheDocument();
  });

  it('deletes uploads that were never saved when the page goes away', async () => {
    const user = userEvent.setup();
    serveUploads(uploaded('a'));
    const deletes = recordDeletes();
    const { unmount } = renderApp(<Harness />);

    await user.upload(fileInput(), png());
    await screen.findByRole('img');
    unmount();

    await waitFor(() => expect(deletes).toEqual([{ path: 'tours/a.png' }]));
  });

  it('keeps uploads that were saved when the page goes away', async () => {
    const user = userEvent.setup();
    serveUploads(uploaded('a'));
    const deletes = recordDeletes();
    const commitRef = { current: null };
    const { unmount } = renderApp(<Harness commitRef={commitRef} />);

    await user.upload(fileInput(), png());
    await screen.findByRole('img');
    commitRef.current();
    unmount();

    // Give a stray request the time to arrive before saying none did.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(deletes).toEqual([]);
  });
});
