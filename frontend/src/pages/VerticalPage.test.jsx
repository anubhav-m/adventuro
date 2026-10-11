import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { routes } from '../router.jsx';
import {
  CATEGORIES,
  GEAR,
  mockCatalog,
  mockGear,
  mockTaxonomies,
  TIDETRAIL,
  VERTICALS,
} from '../test/fixtures.js';
import { renderRoutes } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';

const mockVertical = (key = 'tidetrail', data = TIDETRAIL) =>
  server.use(http.get(api(`/verticals/${key}`), () => success(data)));

const openVertical = async ({ key = 'tidetrail', data, gear } = {}) => {
  mockVertical(key, data);
  mockTaxonomies();
  const gearRequests = mockGear(gear);
  const view = renderRoutes(routes, { path: `/v/${key}` });
  // The hero is there at once; the gear section follows the vertical's own data.
  await screen.findByRole('region', { name: 'Suggested gear' });
  return { ...view, gearRequests };
};

const expeditions = () => within(screen.getByRole('region', { name: 'Curated expeditions' }));
const suggested = () => within(screen.getByRole('region', { name: 'Suggested gear' }));

// The page's own header, around its title.
const hero = () => within(screen.getByRole('heading', { level: 1 }).closest('header'));

describe('VerticalPage', () => {
  it('opens with the vertical on its own field: name, badge, subtitle and description', async () => {
    await openVertical();
    const header = hero();

    expect(document.title).toBe('TideTrail · Adventuro');
    expect(header.getByRole('heading', { level: 1, name: 'TideTrail' })).toBeInTheDocument();
    expect(header.getByText('Ecosystem Vertical')).toBeInTheDocument();
    expect(header.getByText('Ocean Blue & Coastal Thrills')).toBeInTheDocument();
    expect(header.getByText('TideTrail description.')).toBeInTheDocument();
    expect(header.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('main').querySelector('[data-vertical]')).toHaveAttribute(
      'data-vertical',
      'tidetrail',
    );
  });

  it('shows the hero photo when the vertical has one', async () => {
    const heroImage = { url: 'https://images.example.com/tide.jpg', path: null };
    await openVertical({ data: { ...TIDETRAIL, vertical: { ...VERTICALS[0], heroImage } } });

    const photo = hero().getByRole('img', { name: 'TideTrail' });
    expect(photo).toHaveAttribute('src', heroImage.url);
    expect(photo).not.toHaveAttribute('loading');
  });

  it('lists the tours as cards with everything a card shows', async () => {
    await openVertical();
    const [goa, gokarna] = expeditions().getAllByRole('article');

    expect(within(goa).getByRole('heading', { name: 'Goa Coastal Escape' })).toBeInTheDocument();
    expect(within(goa).getByRole('img', { name: 'Goa Coastal Escape' })).toHaveAttribute(
      'loading',
      'lazy',
    );
    expect(within(goa).getByText('4 days · Easy')).toBeInTheDocument();
    expect(within(goa).getByText('Goa')).toBeInTheDocument();
    expect(
      within(goa).getByText('Sun, surf and shacks along the Konkan coast'),
    ).toBeInTheDocument();
    expect(
      within(within(goa).getByRole('list', { name: 'Top activities' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Parasailing', 'Beach hopping', 'Sunset cruise']);
    expect(within(goa).getByText('₹14,999')).toBeInTheDocument();
    expect(within(goa).getByRole('link', { name: 'Explore Goa Coastal Escape' })).toHaveAttribute(
      'href',
      '/tours/goa-coastal-escape',
    );
    expect(within(goa).getByRole('link', { name: 'Book Goa Coastal Escape' })).toHaveAttribute(
      'href',
      '/v/tidetrail?book=goa-coastal-escape',
    );

    // A card holds with no photo, tagline or activities.
    expect(within(gokarna).getByText('1 day · Moderate')).toBeInTheDocument();
    expect(within(gokarna).queryByRole('img')).not.toBeInTheDocument();
    expect(within(gokarna).queryByRole('list')).not.toBeInTheDocument();
  });

  it('says so when the vertical has no tours yet', async () => {
    await openVertical({ data: { ...TIDETRAIL, tours: [] } });

    expect(expeditions().getByText('New expeditions are being planned.')).toBeInTheDocument();
    expect(expeditions().queryByRole('article')).not.toBeInTheDocument();
  });

  it('suggests the gear linked to the vertical, with the affiliate disclosure', async () => {
    const { gearRequests } = await openVertical();

    expect(await suggested().findAllByRole('article')).toHaveLength(GEAR.length);
    expect(gearRequests).toEqual([{ vertical: 'tidetrail', limit: '8' }]);
    expect(suggested().getByRole('link', { name: 'Shop all gear' })).toHaveAttribute(
      'href',
      '/gear',
    );
    expect(suggested().getByRole('link', { name: 'Affiliate disclosure' })).toHaveAttribute(
      'href',
      '/affiliate-disclosure',
    );
  });

  it('filters the suggested gear by category chip, and clears it on a second press', async () => {
    const { gearRequests } = await openVertical({
      gear: ({ category }) => ({
        gear: GEAR.filter((item) => !category || item.category.slug === category),
      }),
    });
    const user = userEvent.setup();
    await suggested().findAllByRole('article');
    const chips = within(suggested().getByRole('group', { name: 'Gear category' }));
    expect(chips.getAllByRole('button').map((chip) => chip.textContent)).toEqual(
      CATEGORIES.map(({ name }) => name),
    );

    await user.click(chips.getByRole('button', { name: 'Water Gear' }));
    await waitFor(() => expect(suggested().getAllByRole('article')).toHaveLength(1));
    expect(suggested().getByRole('heading', { name: /DryTide/ })).toBeInTheDocument();
    expect(chips.getByRole('button', { name: 'Water Gear' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(gearRequests.at(-1)).toEqual({
      vertical: 'tidetrail',
      category: 'water-gear',
      limit: '8',
    });

    await user.click(chips.getByRole('button', { name: 'Solar Chargers' }));
    expect(await suggested().findByText('Nothing in this category yet.')).toBeInTheDocument();

    await user.click(chips.getByRole('button', { name: 'Solar Chargers' }));
    await waitFor(() => expect(suggested().getAllByRole('article')).toHaveLength(GEAR.length));
  });

  it('says so when no gear is linked to the vertical', async () => {
    await openVertical({ gear: () => ({ gear: [] }) });
    expect(await suggested().findByText('No gear picked for this yet.')).toBeInTheDocument();
  });

  it('keeps the tours on screen when only the gear fails, and recovers on Try again', async () => {
    mockVertical();
    mockTaxonomies();
    server.use(http.get(api('/gear'), () => failure(500, 'INTERNAL_ERROR')));
    renderRoutes(routes, { path: '/v/tidetrail' });
    const user = userEvent.setup();
    await screen.findByRole('region', { name: 'Suggested gear' });

    const alert = await suggested().findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong on our side.');
    expect(alert).not.toHaveTextContent('Raw server message');
    expect(expeditions().getAllByRole('article')).toHaveLength(2);

    mockGear();
    await user.click(suggested().getByRole('button', { name: 'Try again' }));
    expect(await suggested().findAllByRole('article')).toHaveLength(GEAR.length);
  });

  it('shows the not-found page for a key outside the six verticals, without asking the API', async () => {
    renderRoutes(routes, { path: '/v/moonwalk' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This trail isn’t on the map.' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('Page not found · Adventuro');
    expect(screen.getByRole('contentinfo').querySelector('[data-vertical]')).toBeNull();
  });

  it('draws the terrain line above the footer in the vertical’s ink', async () => {
    await openVertical();

    const line = screen.getByRole('contentinfo').querySelector('svg');
    expect(line.closest('[data-vertical]')).toHaveAttribute('data-vertical', 'tidetrail');
  });

  it('shows the vertical’s field and name at once, before its data has arrived', async () => {
    let respond;
    server.use(
      http.get(api('/verticals/peakpulse'), async () => {
        await new Promise((resolve) => {
          respond = resolve;
        });
        return success({ vertical: VERTICALS[2], tours: [] });
      }),
    );
    mockTaxonomies();
    mockGear();
    renderRoutes(routes, { path: '/v/peakpulse' });

    expect(await screen.findByRole('heading', { level: 1, name: 'PeakPulse' })).toBeInTheDocument();
    expect(document.title).toBe('PeakPulse · Adventuro');
    expect(screen.getByRole('main').querySelector('[data-vertical]')).toHaveAttribute(
      'data-vertical',
      'peakpulse',
    );
    expect(expeditions().getByRole('status')).toHaveTextContent('Loading');
    expect(hero().queryByText('PeakPulse description.')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Suggested gear' })).not.toBeInTheDocument();

    await waitFor(() => expect(respond).toBeDefined());
    respond();
    expect(await hero().findByText('PeakPulse description.')).toBeInTheDocument();
  });

  it('fills the hero from the verticals the home page already loaded', async () => {
    mockCatalog();
    const { router } = renderRoutes(routes, { path: '/' });
    await screen.findAllByRole('link', { name: /PeakPulse/ });
    server.use(http.get(api('/verticals/peakpulse'), () => new Promise(() => {})));

    await act(() => router.navigate('/v/peakpulse'));

    expect(await hero().findByText('Snow Peaks, Passes & Alpine Treks')).toBeInTheDocument();
    expect(hero().getByText('PeakPulse description.')).toBeInTheDocument();
  });

  it('shows a loading state, then an error with a retry when the vertical fails', async () => {
    server.use(http.get(api('/verticals/peakpulse'), () => failure(429, 'RATE_LIMITED')));
    renderRoutes(routes, { path: '/v/peakpulse' });
    const user = userEvent.setup();
    const main = within(await screen.findByRole('main'));

    expect(await main.findByRole('status')).toHaveTextContent('Loading');
    expect(await main.findByRole('alert')).toHaveTextContent(
      "You're going a bit fast. Please wait a moment and try again.",
    );

    mockVertical('peakpulse', { vertical: VERTICALS[2], tours: [] });
    mockTaxonomies();
    mockGear();
    await user.click(main.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'PeakPulse' })).toBeInTheDocument();
  });
});
