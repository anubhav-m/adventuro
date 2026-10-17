import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useUploadSession } from '../../hooks/useUploadSession.js';
import { renderApp } from '../../test/render.jsx';
import { api, record, server, success } from '../../test/server.js';
import { ImageGallery } from './ImageGallery.jsx';

const image = (name) => ({ url: `https://cdn.example.com/gear/${name}.jpg`, path: null });
const IMAGES = [image('one'), image('two'), image('three')];

const Harness = ({ initial, onChange = () => {}, max = 8 }) => {
  const session = useUploadSession();
  const [value, setValue] = useState(initial);
  return (
    <ImageGallery
      label="Images"
      value={value}
      folder="gear"
      session={session}
      max={max}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const order = () =>
  screen
    .getAllByRole('listitem')
    .map((item) => item.querySelector('img').getAttribute('src').split('/').at(-1));

describe('ImageGallery', () => {
  it('moves an image with its buttons, keeps focus on it and says where it went', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderApp(<Harness initial={IMAGES} onChange={onChange} />);

    expect(screen.getByText(/^3 of 8\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move image 1 earlier' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move image 3 later' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Move image 1 later' }));

    expect(onChange).toHaveBeenLastCalledWith([IMAGES[1], IMAGES[0], IMAGES[2]]);
    expect(order()).toEqual(['two.jpg', 'one.jpg', 'three.jpg']);
    expect(screen.getByRole('listitem', { name: 'Image 2 of 3' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Image moved to position 2 of 3.');
  });

  it('moves the focused image with the arrow keys', async () => {
    const user = userEvent.setup();
    renderApp(<Harness initial={IMAGES} />);

    screen.getByRole('listitem', { name: 'Image 3 of 3' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(order()).toEqual(['one.jpg', 'three.jpg', 'two.jpg']);
    expect(screen.getByRole('listitem', { name: 'Image 2 of 3' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(order()).toEqual(['three.jpg', 'one.jpg', 'two.jpg']);

    await user.keyboard('{ArrowRight}');
    expect(order()).toEqual(['one.jpg', 'three.jpg', 'two.jpg']);
  });

  it('removes an image', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderApp(<Harness initial={IMAGES} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remove image 2' }));

    expect(onChange).toHaveBeenLastCalledWith([IMAGES[0], IMAGES[2]]);
    expect(screen.getByRole('status')).toHaveTextContent('Image removed. 2 left.');
  });

  it('adds an upload at the end, and deletes it from storage if it is removed unsaved', async () => {
    const user = userEvent.setup();
    const fresh = { url: 'https://cdn.example.com/gear/new.png', path: 'gear/new.png' };
    server.use(http.post(api('/admin/uploads'), () => success({ image: fresh }, { status: 201 })));
    const deletes = record('delete', '/admin/uploads', () => success());
    renderApp(<Harness initial={IMAGES.slice(0, 1)} />);

    const add = screen.getByRole('group', { name: 'Add to images' });
    await user.upload(
      within(add).getByLabelText('Add to images: choose a file'),
      new File(['png'], 'new.png', { type: 'image/png' }),
    );

    await waitFor(() => expect(order()).toEqual(['one.jpg', 'new.png']));
    await user.click(screen.getByRole('button', { name: 'Remove image 2' }));
    await waitFor(() => expect(deletes).toEqual([{ path: 'gear/new.png' }]));
  });

  it('hides the add slot once the gallery is full', () => {
    renderApp(<Harness initial={IMAGES} max={3} />);

    expect(screen.queryByRole('button', { name: 'Add image' })).not.toBeInTheDocument();
  });
});
