import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { serveContentLists } from '../test/contentApi.js';
import { GEAR, GEAR_LIST, INACTIVE_GEAR, pageMeta } from '../test/fixtures.js';
import { renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, success } from '../test/server.js';
import { GearPage } from './GearPage.jsx';

const routes = [
  { path: '/gear', element: <GearPage /> },
  { path: '/gear/:id', element: <h1>Gear page</h1> },
];

const serveGearList = () => {
  const queries = [];
  server.use(
    http.get(api('/admin/gear'), ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return success({ gear: GEAR_LIST }, { meta: pageMeta(GEAR_LIST.length) });
    }),
  );
  return queries;
};

beforeEach(() => serveContentLists());

const setup = async () => {
  const view = renderRoutes(routes, { path: '/gear' });
  await screen.findByText(GEAR.name);
  return { user: userEvent.setup(), ...view };
};

const row = (name) => screen.getByText(name).closest('tr');

describe('GearPage', () => {
  it('lists each item with its category, prices, clicks and status', async () => {
    serveGearList();
    await setup();

    const bag = within(row(GEAR.name));
    expect(bag.getByText('Water Gear')).toBeInTheDocument();
    expect(bag.getByText('₹1,499')).toBeInTheDocument();
    expect(bag.getByText('₹1,999')).toBeInTheDocument();
    expect(bag.getByText('7')).toBeInTheDocument();
    expect(bag.getByRole('switch', { name: `Active: ${GEAR.name}` })).toBeChecked();
    // No discount, so no struck-through MRP.
    expect(within(row(INACTIVE_GEAR.name)).getAllByText('₹3,499')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'New gear' })).toHaveAttribute('href', '/gear/new');
  });

  it('filters by taxonomy and status', async () => {
    const queries = serveGearList();
    const { user } = await setup();

    const climate = screen.getByRole('combobox', { name: 'Climate' });
    await waitFor(() => expect(within(climate).getByText('Tropical/Beach')).toBeInTheDocument());
    await user.selectOptions(climate, 'Tropical/Beach');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'Inactive');

    await waitFor(() =>
      expect(queries.at(-1)).toEqual({
        climate: 'clim-beach',
        isActive: 'false',
        page: '1',
        limit: '20',
      }),
    );
  });

  it('activates an item from the list', async () => {
    serveGearList();
    const patched = record('patch', `/admin/gear/${INACTIVE_GEAR.id}`, (body) =>
      success({ gear: { ...INACTIVE_GEAR, ...body } }),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('switch', { name: `Active: ${INACTIVE_GEAR.name}` }));

    expect(await screen.findByText(`${INACTIVE_GEAR.name} is active.`)).toBeInTheDocument();
    expect(patched).toEqual([{ isActive: true }]);
  });

  it('says why a status change failed', async () => {
    serveGearList();
    server.use(http.patch(api(`/admin/gear/${GEAR.id}`), () => failure(500, 'INTERNAL_ERROR')));
    const { user } = await setup();

    await user.click(screen.getByRole('switch', { name: `Active: ${GEAR.name}` }));

    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
  });

  it('deletes an item after asking, naming it', async () => {
    serveGearList();
    server.use(http.delete(api(`/admin/gear/${GEAR.id}`), () => success()));
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Delete ${GEAR.name}` }));
    const dialog = screen.getByRole('dialog', { name: `Delete ${GEAR.name}?` });
    expect(dialog).toHaveTextContent('its images and its click history');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(`${GEAR.name} deleted.`)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
