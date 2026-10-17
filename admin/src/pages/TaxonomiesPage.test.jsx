import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { FIELD_MESSAGES } from '../lib/schemas.js';
import { serveContentLists } from '../test/contentApi.js';
import { TAXONOMIES } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, success } from '../test/server.js';
import { TaxonomiesPage } from './TaxonomiesPage.jsx';

const [BACKPACKS, WATER] = TAXONOMIES.category;

beforeEach(() => serveContentLists());

const setup = async (path = '/taxonomies') => {
  const view = renderRoutes([{ path: '/taxonomies', element: <TaxonomiesPage /> }], { path });
  await screen.findByRole('table', { name: 'Categories' });
  await screen.findByText(BACKPACKS.name);
  return { user: userEvent.setup(), ...view };
};

const panel = () => screen.getByRole('tabpanel');
const row = (name) => within(panel()).getByText(name).closest('tr');

describe('TaxonomiesPage', () => {
  it('shows one list per tab and keeps the open tab in the URL', async () => {
    const { user, router } = await setup();

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Categories',
      'Climates',
      'Tags',
    ]);
    expect(within(panel()).getByText('water-gear')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Climates' }));
    expect(currentUrl(router)).toBe('/taxonomies?type=climate');
    expect(await within(panel()).findByText('Tropical/Beach')).toBeInTheDocument();
  });

  it('opens the tab the URL names', async () => {
    renderRoutes([{ path: '/taxonomies', element: <TaxonomiesPage /> }], {
      path: '/taxonomies?type=tag',
    });

    expect(await screen.findByRole('tab', { name: 'Tags' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await within(screen.getByRole('tabpanel')).findByText('Waterproof')).toBeInTheDocument();
  });

  it('adds an item to the open list', async () => {
    const created = record('post', '/admin/taxonomies', (body) =>
      success({ taxonomy: { id: 'cat-new', slug: 'tents', ...body } }, { status: 201 }),
    );
    const { user } = await setup();
    const name = within(panel()).getByRole('textbox', { name: 'New category' });

    await user.click(within(panel()).getByRole('button', { name: 'Add' }));
    expect(name).toHaveAccessibleDescription(FIELD_MESSAGES.name);
    expect(created).toEqual([]);

    await user.type(name, '  Tents ');
    await user.click(within(panel()).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Tents added.')).toBeInTheDocument();
    expect(created).toEqual([{ type: 'category', name: 'Tents' }]);
    expect(name).toHaveValue('');
  });

  it('says so when the name is already taken', async () => {
    server.use(http.post(api('/admin/taxonomies'), () => failure(409, 'DUPLICATE')));
    const { user } = await setup();

    await user.type(within(panel()).getByRole('textbox', { name: 'New category' }), 'Backpacks');
    await user.click(within(panel()).getByRole('button', { name: 'Add' }));

    expect(
      await within(panel()).findByText(
        'Something with this name already exists. Try a different name.',
      ),
    ).toBeInTheDocument();
  });

  it('renames an item in place, with Enter, and drops a rename with Escape', async () => {
    const renamed = record('patch', `/admin/taxonomies/${WATER.id}`, (body) =>
      success({ taxonomy: { ...WATER, ...body } }),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Rename ${WATER.name}` }));
    const input = screen.getByRole('textbox', { name: `New name for ${WATER.name}` });
    expect(input).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('textbox', { name: `New name for ${WATER.name}` }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Rename ${WATER.name}` }));
    await user.clear(screen.getByRole('textbox', { name: `New name for ${WATER.name}` }));
    await user.click(screen.getByRole('button', { name: `Save the new name for ${WATER.name}` }));
    expect(
      screen.getByRole('textbox', { name: `New name for ${WATER.name}` }),
    ).toHaveAccessibleDescription(FIELD_MESSAGES.name);

    await user.type(
      screen.getByRole('textbox', { name: `New name for ${WATER.name}` }),
      'Water Sports{Enter}',
    );

    expect(await screen.findByText('Renamed to Water Sports.')).toBeInTheDocument();
    expect(renamed).toEqual([{ name: 'Water Sports' }]);
  });

  it('shows a refused rename on the field, in our words', async () => {
    server.use(http.patch(api(`/admin/taxonomies/${WATER.id}`), () => failure(409, 'DUPLICATE')));
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Rename ${WATER.name}` }));
    await user.type(screen.getByRole('textbox', { name: `New name for ${WATER.name}` }), 's');
    await user.click(screen.getByRole('button', { name: `Save the new name for ${WATER.name}` }));

    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: `New name for ${WATER.name}` }),
      ).toHaveAccessibleDescription(
        'Something with this name already exists. Try a different name.',
      ),
    );
    await user.click(screen.getByRole('button', { name: `Cancel renaming ${WATER.name}` }));
    expect(within(row(WATER.name)).getByText(WATER.slug)).toBeInTheDocument();
  });

  it('deletes an item after asking', async () => {
    server.use(http.delete(api(`/admin/taxonomies/${WATER.id}`), () => success()));
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Delete ${WATER.name}` }));
    const dialog = screen.getByRole('dialog', { name: `Delete ${WATER.name}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(`${WATER.name} deleted.`)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('explains that gear still uses an item it cannot delete', async () => {
    server.use(
      http.delete(api(`/admin/taxonomies/${BACKPACKS.id}`), () => failure(409, 'RESOURCE_IN_USE')),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Delete ${BACKPACKS.name}` }));
    const dialog = screen.getByRole('dialog', { name: `Delete ${BACKPACKS.name}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(
      await within(dialog).findByText(
        'Some gear still uses this, so it can’t be deleted. Take it off that gear first.',
      ),
    ).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent('Raw server message');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
