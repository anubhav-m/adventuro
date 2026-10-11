import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { routes } from '../router.jsx';
import { CATEGORIES, GRAND_INDIA, mockCatalog, VERTICALS } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';

const SERVER_FAULT = 'Something went wrong on our side. Please try again in a moment.';

const openHome = async (catalog) => {
  mockCatalog(catalog);
  const view = renderRoutes(routes, { path: '/' });
  await screen.findByRole('heading', { level: 1, name: 'Adventuro' });
  return view;
};

const picker = () => within(screen.getByRole('region', { name: 'Choose your adventure' }));
const grandIndia = () => within(screen.getByRole('region', { name: 'Grand India Tour' }));
const gear = () => within(screen.getByRole('region', { name: 'Gear for every terrain' }));

describe('HomePage', () => {
  it('opens with the hero: name, tagline, line, the four figures and both actions', async () => {
    await openHome();
    const hero = within(screen.getByRole('region', { name: 'Adventuro' }));

    expect(document.title).toBe('Adventuro · From Coast to Camp • Peak to Palace');
    expect(hero.getByText('From Coast to Camp • Peak to Palace')).toBeInTheDocument();
    expect(hero.getByText('One India. Infinite Adventures.')).toBeInTheDocument();
    expect(hero.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '5 verticalsUnlimited stories',
      '28+ statesCountless destinations',
      '100% curatedExpert-led trips',
      'MemoriesThat last forever',
    ]);
    expect(hero.getByRole('link', { name: 'Book Now' })).toHaveAttribute(
      'href',
      '/#choose-your-adventure',
    );
    expect(hero.getByRole('link', { name: 'Explore Gear Store' })).toHaveAttribute('href', '/gear');
  });

  it('puts its sections in the order of the UI flow', async () => {
    await openHome();
    await gear().findByRole('link', { name: 'Backpacks' });
    await grandIndia().findByRole('link', { name: 'View Itinerary' });

    expect(
      within(screen.getByRole('main'))
        .getAllByRole('heading')
        .filter((heading) => ['H1', 'H2'].includes(heading.tagName))
        .map((heading) => heading.textContent),
    ).toEqual(['Adventuro', 'Choose your adventure', 'Grand India Tour', 'Gear for every terrain']);
  });

  it('Book Now moves to the vertical picker', async () => {
    const { router } = await openHome();
    const user = userEvent.setup();

    await user.click(screen.getByRole('link', { name: 'Book Now' }));

    await waitFor(() => expect(currentUrl(router)).toBe('/#choose-your-adventure'));
    expect(screen.getByRole('region', { name: 'Choose your adventure' })).toHaveAttribute(
      'id',
      'choose-your-adventure',
    );
  });

  it('renders the six verticals from the API: the route, then five bands coast to peak', async () => {
    await openHome();
    const links = await picker().findAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/v/grand-india-tour',
      '/v/tidetrail',
      '/v/goldensaga',
      '/v/urbanecho',
      '/v/peakpulse',
      '/v/elitescape',
    ]);
    expect(links[0]).toHaveTextContent('Grand India Tour, one route through all five');
    expect(links[1]).toHaveTextContent('TideTrail');
    expect(links[1]).toHaveTextContent('Ocean Blue & Coastal Thrills');
    expect(links[4]).toHaveTextContent('PeakPulse');
    expect(links[4]).toHaveTextContent('Snow Peaks, Passes & Alpine Treks');
    for (const link of links) {
      expect(link).toHaveAttribute('data-vertical', link.getAttribute('href').slice(3));
    }
  });

  it('shows names and one-liners as the API has them, since admins edit them', async () => {
    const verticals = VERTICALS.map((vertical) =>
      vertical.key === 'peakpulse'
        ? { ...vertical, name: 'PeakPulse Plus', subtitle: 'Higher, colder, quieter' }
        : vertical,
    );
    await openHome({ verticals });

    const band = await picker().findByRole('link', { name: /PeakPulse Plus/ });
    expect(band).toHaveTextContent('Higher, colder, quieter');
    expect(band).toHaveAttribute('href', '/v/peakpulse');
  });

  it('draws the bands without the route when the API has no Grand India Tour', async () => {
    await openHome({ verticals: VERTICALS.slice(0, 5) });

    expect(await picker().findAllByRole('link')).toHaveLength(5);
    expect(picker().queryByText(/one route through all five/)).not.toBeInTheDocument();
  });

  it('features Grand India Tour with its newest tour’s experiences and itinerary', async () => {
    await openHome();
    const itinerary = await grandIndia().findByRole('link', { name: 'View Itinerary' });

    expect(itinerary).toHaveAttribute('href', '/tours/grand-india-highlights');
    expect(grandIndia().getByText('One Journey. Countless Stories.')).toBeInTheDocument();
    expect(grandIndia().getByText('Grand India Tour description.')).toBeInTheDocument();
    expect(
      within(grandIndia().getByRole('list', { name: 'Signature experiences' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Taj Mahal at sunrise', 'Hot-air balloon', 'Amber Fort']);

    const photo = grandIndia().getByRole('img', { name: 'Grand India Tour' });
    expect(photo).toHaveAttribute('src', 'https://images.example.com/grand.jpg');
    expect(photo).toHaveAttribute('loading', 'lazy');
  });

  it('links View Itinerary to the vertical page when it has no tour, and holds without a photo', async () => {
    await openHome({
      grandIndia: { vertical: { ...GRAND_INDIA.vertical, heroImage: null }, tours: [] },
    });

    expect(await grandIndia().findByRole('link', { name: 'View Itinerary' })).toHaveAttribute(
      'href',
      '/v/grand-india-tour',
    );
    expect(grandIndia().queryByRole('list')).not.toBeInTheDocument();
    expect(grandIndia().queryByRole('img')).not.toBeInTheDocument();
  });

  it('links each gear category to the store filtered by its slug', async () => {
    await openHome();
    await gear().findByRole('link', { name: 'Backpacks' });

    expect(
      within(gear().getByRole('list'))
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual(CATEGORIES.map(({ name, slug }) => [name, `/gear?category=${slug}`]));
    expect(gear().getByRole('link', { name: 'Shop all gear' })).toHaveAttribute('href', '/gear');
  });

  it('asks the API for categories only', async () => {
    const types = [];
    await openHome();
    server.use(
      http.get(api('/taxonomies'), ({ request }) => {
        types.push(new URL(request.url).searchParams.get('type'));
        return success({ taxonomies: CATEGORIES });
      }),
    );
    renderRoutes(routes, { path: '/' });

    await waitFor(() => expect(types).toEqual(['category']));
  });

  it('says so when there are no gear categories yet', async () => {
    await openHome({ categories: [] });

    expect(await gear().findByText('Gear categories are on their way.')).toBeInTheDocument();
    expect(gear().queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows loading skeletons in every data section until its data arrives', async () => {
    await openHome();

    for (const section of [picker(), grandIndia(), gear()]) {
      expect(section.getByRole('status')).toHaveTextContent('Loading');
    }
    await gear().findByRole('link', { name: 'Backpacks' });
    await grandIndia().findByRole('link', { name: 'View Itinerary' });
    await picker().findAllByRole('link');
    expect(screen.getByRole('main').querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });

  it('shows an error with a retry in a section that fails, and recovers on Try again', async () => {
    mockCatalog();
    server.use(
      http.get(api('/verticals'), () => failure(500, 'INTERNAL_ERROR')),
      http.get(api('/taxonomies'), () => failure(429, 'RATE_LIMITED')),
    );
    renderRoutes(routes, { path: '/' });
    const user = userEvent.setup();
    await screen.findByRole('heading', { level: 1, name: 'Adventuro' });

    const pickerAlert = await picker().findByRole('alert');
    expect(pickerAlert).toHaveTextContent(SERVER_FAULT);
    expect(pickerAlert).not.toHaveTextContent('Raw server message');
    expect(await gear().findByRole('alert')).toHaveTextContent(
      "You're going a bit fast. Please wait a moment and try again.",
    );
    // The section that did load is unaffected.
    expect(await grandIndia().findByRole('link', { name: 'View Itinerary' })).toBeInTheDocument();

    mockCatalog();
    await user.click(picker().getByRole('button', { name: 'Try again' }));
    expect(await picker().findAllByRole('link')).toHaveLength(6);
    expect(picker().queryByRole('alert')).not.toBeInTheDocument();

    await user.click(gear().getByRole('button', { name: 'Try again' }));
    expect(await gear().findByRole('link', { name: 'Water Gear' })).toBeInTheDocument();
  });

  it('shows an error in the Grand India section when it fails, on neutral ground', async () => {
    mockCatalog();
    server.use(http.get(api('/verticals/grand-india-tour'), () => failure(404, 'NOT_FOUND')));
    renderRoutes(routes, { path: '/' });
    await screen.findByRole('heading', { level: 1, name: 'Adventuro' });

    expect(await grandIndia().findByRole('alert')).toHaveTextContent(
      "We couldn't find what you're looking for.",
    );
    expect(grandIndia().queryByRole('link', { name: 'View Itinerary' })).not.toBeInTheDocument();
    // The ink field belongs to the content: without it the section stays on neutral ground.
    expect(screen.getByRole('main').querySelector('[data-vertical="grand-india-tour"]')).toBe(
      picker().getAllByRole('link')[0],
    );
  });
});
