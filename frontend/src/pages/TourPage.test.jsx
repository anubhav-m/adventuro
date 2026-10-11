import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { routes } from '../router.jsx';
import { GEAR, GOA_TOUR, mockGear } from '../test/fixtures.js';
import { renderRoutes } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';

const mockTour = (tour = GOA_TOUR) =>
  server.use(http.get(api(`/tours/${tour.slug}`), () => success({ tour })));

const openTour = async ({ tour = GOA_TOUR, hash = '' } = {}) => {
  mockTour(tour);
  const gearRequests = mockGear();
  const view = renderRoutes(routes, { path: `/tours/${tour.slug}${hash}` });
  await screen.findByRole('heading', { level: 1, name: tour.title });
  return { ...view, gearRequests };
};

const region = (name) => within(screen.getByRole('region', { name }));
const itemsOf = (list) =>
  within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent);

// The page's own header, around its title.
const hero = () => within(screen.getByRole('heading', { level: 1 }).closest('header'));

describe('TourPage', () => {
  it('opens with the tour on its vertical’s field', async () => {
    await openTour();
    const header = hero();

    expect(document.title).toBe('Goa Coastal Escape · Adventuro');
    expect(screen.getByRole('article')).toHaveAttribute('data-vertical', 'tidetrail');
    expect(header.getByText('Sun, surf and shacks along the Konkan coast')).toBeInTheDocument();
    expect(itemsOf(header.getByRole('list', { name: 'At a glance' }))).toEqual([
      'North Goa, Goa',
      '4 days',
      'Easy',
    ]);
    expect(header.getByRole('img', { name: 'Goa Coastal Escape' })).toHaveAttribute(
      'src',
      GOA_TOUR.coverImage.url,
    );
    expect(header.getByRole('link', { name: 'TideTrail' })).toHaveAttribute('href', '/v/tidetrail');
    expect(header.getByRole('link', { name: 'View packages' })).toHaveAttribute(
      'href',
      '/tours/goa-coastal-escape#book',
    );
  });

  it('renders every section of the UI flow from the tour, in order', async () => {
    await openTour();

    expect(
      within(screen.getByRole('list', { name: 'Photos' }))
        .getAllByRole('img')
        .map((photo) => photo.getAttribute('alt')),
    ).toEqual(['Goa Coastal Escape, photo 1', 'Goa Coastal Escape, photo 2']);

    expect(region('Overview').getByText('Four easy days on the Goan coast.')).toBeInTheDocument();
    expect(itemsOf(region('Overview').getByRole('list', { name: 'Top activities' }))).toEqual(
      GOA_TOUR.topActivities,
    );

    const signature = region('Parasailing over Calangute');
    expect(signature.getByText('Signature activity')).toBeInTheDocument();
    expect(signature.getByText('Float 300 feet above the Arabian Sea.')).toBeInTheDocument();

    expect(itemsOf(region('Day by day').getByRole('list'))).toEqual([
      'Day 1Arrival and Candolim sunsetAirport pickup and dinner.',
      'Day 2Water sports day',
    ]);

    const covers = region('What the price covers');
    expect(itemsOf(covers.getByRole('list', { name: 'Included' }))).toEqual(GOA_TOUR.inclusions);
    expect(itemsOf(covers.getByRole('list', { name: 'Not included' }))).toEqual(
      GOA_TOUR.exclusions,
    );

    const reporting = region('Where and when to report');
    expect(reporting.getByText('Dabolim Airport')).toBeInTheDocument();
    expect(reporting.getByText('Arrivals gate 2, Dabolim')).toBeInTheDocument();
    expect(reporting.getByText('10:30 AM')).toBeInTheDocument();

    expect(
      within(screen.getByRole('main'))
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      'Overview',
      'Parasailing over Calangute',
      'Day by day',
      'What the price covers',
      'Where and when to report',
      'Choose your package',
      'Gear for this trip',
    ]);
  });

  it('offers the packages as one choice, starting on the first, and keeps the selection', async () => {
    await openTour();
    const user = userEvent.setup();
    const packages = region('Choose your package');
    const options = packages.getAllByRole('radio');

    expect(screen.getByRole('region', { name: 'Choose your package' })).toHaveAttribute(
      'id',
      'book',
    );
    expect(options.map((option) => option.closest('label').textContent)).toEqual([
      'EssentialShared stays.₹14,999per person',
      'ExplorerPrivate rooms.₹18,749per person',
      'VIP Palace₹25,498per person',
    ]);
    expect(options[0]).toBeChecked();

    await user.click(packages.getByRole('radio', { name: /Explorer/ }));
    expect(options[1]).toBeChecked();
    expect(options[0]).not.toBeChecked();

    // One radio group: the arrow keys move the choice.
    await user.keyboard('{ArrowDown}');
    expect(options[2]).toBeChecked();
  });

  it('brings the packages into view when opened from a Book link', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    await openTour({ hash: '#book' });

    expect(scrollIntoView.mock.contexts).toContain(
      screen.getByRole('region', { name: 'Choose your package' }),
    );
    scrollIntoView.mockRestore();
  });

  it('suggests the gear linked to the tour, without category chips', async () => {
    const { gearRequests } = await openTour();
    const gear = region('Gear for this trip');

    expect(await gear.findAllByRole('article')).toHaveLength(GEAR.length);
    expect(gearRequests).toEqual([{ tour: 'goa-coastal-escape', limit: '8' }]);
    expect(gear.queryByRole('group')).not.toBeInTheDocument();
    expect(gear.getByRole('link', { name: 'Affiliate disclosure' })).toBeInTheDocument();
  });

  it('holds when every optional field is missing', async () => {
    const bare = {
      ...GOA_TOUR,
      tagline: '',
      coverImage: null,
      gallery: [],
      topActivities: [],
      itinerary: [],
      inclusions: [],
      exclusions: [],
      difficulty: 'expert',
      reporting: { location: 'Dabolim Airport', address: '', time: '06:05' },
      tiers: [{ id: 'tier-1', name: 'Essential', description: '', pricePerPerson: 14999 }],
    };
    await openTour({ tour: bare });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Photos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Day by day' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'What the price covers' })).not.toBeInTheDocument();
    expect(region('Overview').queryByRole('list')).not.toBeInTheDocument();
    expect(region('Where and when to report').getByText('6:05 AM')).toBeInTheDocument();
    expect(region('Choose your package').getAllByRole('radio')).toHaveLength(1);
    // A difficulty this app has no label for is shown as the API has it.
    expect(hero().getByText('expert')).toBeInTheDocument();
  });

  it('shows only the list that has items when the other is empty', async () => {
    await openTour({ tour: { ...GOA_TOUR, exclusions: [] } });
    const covers = region('What the price covers');

    expect(covers.getByRole('list', { name: 'Included' })).toBeInTheDocument();
    expect(covers.queryByRole('list', { name: 'Not included' })).not.toBeInTheDocument();
  });

  it.each([
    ['an unknown slug', 404, 'NOT_FOUND'],
    ['a slug the API rejects', 400, 'VALIDATION_ERROR'],
  ])('shows the not-found page for %s', async (_case, status, code) => {
    server.use(http.get(api('/tours/:slug'), () => failure(status, code)));
    renderRoutes(routes, { path: '/tours/no-such-tour' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This trail isn’t on the map.' }),
    ).toBeInTheDocument();
  });

  it('shows an error with a retry when the tour fails to load', async () => {
    server.use(http.get(api('/tours/:slug'), () => failure(500, 'INTERNAL_ERROR')));
    renderRoutes(routes, { path: `/tours/${GOA_TOUR.slug}` });
    const user = userEvent.setup();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong on our side.');
    expect(alert).not.toHaveTextContent('Raw server message');

    mockTour();
    mockGear();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Goa Coastal Escape' }),
    ).toBeInTheDocument();
  });
});
