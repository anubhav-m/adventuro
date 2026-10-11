import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { routes } from '../router.jsx';
import { GEAR, mockGear, mockTaxonomies, pageMeta } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, server } from '../test/server.js';

const openStore = async ({ path = '/gear', gear, taxonomies } = {}) => {
  mockTaxonomies(taxonomies);
  const requests = mockGear(gear);
  const view = renderRoutes(routes, { path });
  await screen.findByRole('heading', { level: 1, name: 'Gear store' });
  return { ...view, requests, user: userEvent.setup() };
};

const filters = () => within(screen.getByRole('region', { name: 'Filters' }));
const results = () => within(screen.getByRole('region', { name: 'Gear' }));
const lastOf = (requests) => requests.at(-1);

describe('GearStorePage', () => {
  it('lists gear cards with the affiliate disclosure and a count', async () => {
    const { requests } = await openStore();
    const [dryBag, daypack] = await results().findAllByRole('article');

    expect(document.title).toBe('Gear store · Adventuro');
    expect(requests).toEqual([{ sort: 'newest', page: '1', limit: '12' }]);
    expect(results().getByRole('status')).toHaveTextContent('2 items');
    expect(screen.getByRole('link', { name: 'Affiliate disclosure' })).toHaveAttribute(
      'href',
      '/affiliate-disclosure',
    );

    expect(within(dryBag).getByRole('img', { name: GEAR[0].name })).toHaveAttribute(
      'src',
      GEAR[0].images[0].url,
    );
    expect(within(dryBag).getByText('Water Gear')).toBeInTheDocument();
    expect(within(dryBag).getByRole('heading', { name: GEAR[0].name })).toBeInTheDocument();
    expect(within(dryBag).getByText('Fully waterproof roll-top bag.')).toBeInTheDocument();
    expect(within(dryBag).getByText('₹899')).toBeInTheDocument();
    expect(within(dryBag).getByText('₹1,299').closest('s')).toHaveTextContent('MRP ₹1,299');

    // No photo, no description, and no struck price when nothing is off.
    expect(within(daypack).queryByRole('img')).not.toBeInTheDocument();
    expect(within(daypack).getByText('₹1,499')).toBeInTheDocument();
    expect(daypack.querySelector('s')).not.toBeInTheDocument();
  });

  it('makes Buy the affiliate redirect, opened in a new tab and marked sponsored', async () => {
    await openStore();
    const buy = await results().findByRole('link', { name: /^Buy DryTide/ });

    expect(buy).toHaveAttribute('href', `/api/v1/gear/${GEAR[0].id}/go`);
    expect(buy).toHaveAttribute('target', '_blank');
    expect(buy.getAttribute('rel').split(' ')).toEqual(
      expect.arrayContaining(['noopener', 'noreferrer', 'sponsored']),
    );
    expect(buy).toHaveAccessibleName(`Buy ${GEAR[0].name} (opens in a new tab)`);
  });

  it('writes each filter to the URL and sends it to the API', async () => {
    const { router, requests, user } = await openStore();
    await results().findAllByRole('article');

    await user.click(await filters().findByRole('button', { name: 'Water Gear' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?category=water-gear'));
    await waitFor(() => expect(lastOf(requests)).toMatchObject({ category: 'water-gear' }));

    await user.click(filters().getByRole('button', { name: 'Tropical/Beach' }));
    await waitFor(() =>
      expect(currentUrl(router)).toBe('/gear?category=water-gear&climate=tropical-beach'),
    );

    await user.selectOptions(filters().getByRole('combobox', { name: 'Tag' }), 'Waterproof');
    await user.selectOptions(
      filters().getByRole('combobox', { name: 'Sort by' }),
      'Price: low to high',
    );
    await waitFor(() =>
      expect(currentUrl(router)).toBe(
        '/gear?category=water-gear&climate=tropical-beach&tag=waterproof&sort=price_asc',
      ),
    );
    await waitFor(() =>
      expect(lastOf(requests)).toEqual({
        category: 'water-gear',
        climate: 'tropical-beach',
        tag: 'waterproof',
        sort: 'price_asc',
        page: '1',
        limit: '12',
      }),
    );

    // Pressing a selected chip again, and choosing the first option, clear that filter.
    await user.click(filters().getByRole('button', { name: 'Water Gear' }));
    await user.selectOptions(filters().getByRole('combobox', { name: 'Tag' }), 'Any tag');
    await user.selectOptions(filters().getByRole('combobox', { name: 'Sort by' }), 'Newest');
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?climate=tropical-beach'));
  });

  it('searches once typing pauses, and only sends a term the API accepts', async () => {
    const { router, requests, user } = await openStore();
    await results().findAllByRole('article');
    const box = filters().getByRole('searchbox', { name: 'Search gear' });

    await user.type(box, 'dry bag');
    // Nothing is asked while the keys are still going down.
    expect(requests).toHaveLength(1);
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?q=dry+bag'));
    await waitFor(() => expect(lastOf(requests)).toMatchObject({ q: 'dry bag' }));
    expect(requests).toHaveLength(2);
    expect(box).toHaveValue('dry bag');

    await user.clear(box);
    await user.type(box, 'd');
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?q=d'));
    await waitFor(() => expect(lastOf(requests)).not.toHaveProperty('q'));
  });

  it('reads its filters from the URL, so a filtered list can be shared', async () => {
    const { requests } = await openStore({
      path: '/gear?q=bag&category=water-gear&climate=tropical-beach&tag=waterproof&sort=popular&page=2',
      gear: () => ({ gear: GEAR, meta: pageMeta({ page: 2, total: 14, totalPages: 2 }) }),
    });
    await results().findAllByRole('article');

    expect(requests[0]).toEqual({
      q: 'bag',
      category: 'water-gear',
      climate: 'tropical-beach',
      tag: 'waterproof',
      sort: 'popular',
      page: '2',
      limit: '12',
    });
    expect(filters().getByRole('searchbox', { name: 'Search gear' })).toHaveValue('bag');
    expect(await filters().findByRole('button', { name: 'Water Gear' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(filters().getByRole('button', { name: 'Tropical/Beach' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(filters().getByRole('combobox', { name: 'Tag' })).toHaveValue('waterproof');
    expect(filters().getByRole('combobox', { name: 'Sort by' })).toHaveValue('popular');
    expect(results().getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('restores the filters and the search box when the back button is used', async () => {
    const { router, requests, user } = await openStore();
    await results().findAllByRole('article');
    const box = filters().getByRole('searchbox', { name: 'Search gear' });

    await user.click(await filters().findByRole('button', { name: 'Backpacks' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?category=backpacks'));
    await user.click(filters().getByRole('button', { name: 'High Altitude/Snow' }));
    await waitFor(() =>
      expect(currentUrl(router)).toBe('/gear?category=backpacks&climate=high-altitude-snow'),
    );

    await act(() => router.navigate(-1));
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?category=backpacks'));
    expect(filters().getByRole('button', { name: 'High Altitude/Snow' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(filters().getByRole('button', { name: 'Backpacks' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() =>
      expect(lastOf(requests)).toEqual({
        category: 'backpacks',
        sort: 'newest',
        page: '1',
        limit: '12',
      }),
    );

    // A typed search replaces the entry it was typed on, so one step back leaves the store's
    // filtered list, and the box follows the URL when it changes elsewhere.
    await user.type(box, 'pack');
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?category=backpacks&q=pack'));
    await act(() => router.navigate(-1));
    await waitFor(() => expect(currentUrl(router)).toBe('/gear'));
    await waitFor(() => expect(box).toHaveValue(''));
  });

  it('turns pages through the URL, and a changed filter returns to the first page', async () => {
    const { router, requests, user } = await openStore({
      gear: ({ page }) => ({
        gear: GEAR,
        meta: pageMeta({ page: Number(page), total: 30, totalPages: 3 }),
      }),
    });
    await results().findAllByRole('article');
    expect(results().getByRole('status')).toHaveTextContent('30 items');

    await user.click(results().getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?page=2'));
    await waitFor(() => expect(lastOf(requests)).toMatchObject({ page: '2' }));
    await waitFor(() =>
      expect(results().getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page',
      ),
    );

    await user.click(results().getByRole('button', { name: 'Page 3' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?page=3'));

    await user.click(await filters().findByRole('button', { name: 'Backpacks' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/gear?category=backpacks'));
    await waitFor(() => expect(lastOf(requests)).toMatchObject({ page: '1' }));
  });

  it('treats a page that is not a number as the first page', async () => {
    const { requests } = await openStore({ path: '/gear?page=abc' });
    await results().findAllByRole('article');

    expect(requests[0]).toMatchObject({ page: '1' });
  });

  it('offers to clear the filters when nothing matches', async () => {
    const { router, requests, user } = await openStore({
      path: '/gear?q=zzz&category=water-gear',
      gear: ({ q }) => ({ gear: q ? [] : GEAR }),
    });

    expect(await results().findByText('No gear matches these filters.')).toBeInTheDocument();
    await user.click(results().getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(currentUrl(router)).toBe('/gear'));
    expect(await results().findAllByRole('article')).toHaveLength(GEAR.length);
    expect(lastOf(requests)).toEqual({ sort: 'newest', page: '1', limit: '12' });
    expect(filters().getByRole('searchbox', { name: 'Search gear' })).toHaveValue('');
  });

  it('leaves out a filter group the admin has nothing in', async () => {
    await openStore({ taxonomies: [] });
    await results().findAllByRole('article');

    await waitFor(() => expect(filters().queryByRole('status')).not.toBeInTheDocument());
    expect(filters().queryByRole('group')).not.toBeInTheDocument();
    expect(filters().queryByRole('combobox', { name: 'Tag' })).not.toBeInTheDocument();
    expect(filters().getByRole('combobox', { name: 'Sort by' })).toBeInTheDocument();
  });

  it('shows loading, then an error with a retry, and never the server’s own message', async () => {
    mockTaxonomies();
    server.use(http.get(api('/gear'), () => failure(500, 'INTERNAL_ERROR')));
    renderRoutes(routes, { path: '/gear' });
    const user = userEvent.setup();
    await screen.findByRole('heading', { level: 1, name: 'Gear store' });

    expect(results().getByRole('status')).toHaveTextContent('Loading');
    const alert = await results().findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong on our side.');
    expect(alert).not.toHaveTextContent('Raw server message');

    mockGear();
    await user.click(results().getByRole('button', { name: 'Try again' }));
    expect(await results().findAllByRole('article')).toHaveLength(GEAR.length);
  });
});
