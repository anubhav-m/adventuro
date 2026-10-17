import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { DUPLICATE_SLUG_MESSAGE } from '../lib/errors.js';
import { FIELD_MESSAGES } from '../lib/schemas.js';
import { serveContentLists } from '../test/contentApi.js';
import { DRAFT_TOUR, GEAR, TOUR } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, success } from '../test/server.js';
import { GearEditPage } from './GearEditPage.jsx';

const routes = [
  { path: '/gear', element: <h1>Gear list</h1> },
  { path: '/gear/new', element: <GearEditPage /> },
  { path: '/gear/:id', element: <GearEditPage /> },
];

beforeEach(() => serveContentLists());

const serveGear = (gear = GEAR) =>
  server.use(http.get(api(`/admin/gear/${gear.id}`), () => success({ gear })));

const setup = async (path) => {
  const view = renderRoutes(routes, { path });
  await screen.findByRole('heading', { level: 1, name: /New gear|DryTide/ });
  return { user: userEvent.setup(), ...view };
};

const field = (name) => screen.getByRole('textbox', { name });
const price = (name) => screen.getByRole('spinbutton', { name });
const saveButton = () => screen.getByRole('button', { name: 'Save' });

const choose = async (user, picker, option) => {
  await user.click(screen.getByRole('button', { name: picker }));
  await user.click(await screen.findByRole('checkbox', { name: option }));
  await user.keyboard('{Escape}');
};

describe('GearEditPage: new gear', () => {
  it('asks for what an item needs before saving', async () => {
    const { user } = await setup('/gear/new');

    await user.type(field('Name'), 'Storm Shell');
    expect(field('Slug')).toHaveValue('storm-shell');
    await user.click(saveButton());

    expect(
      await screen.findByText(
        "Some details don't look right. Please check the highlighted fields.",
      ),
    ).toBeInTheDocument();
    expect(price('MRP')).toHaveAccessibleDescription(FIELD_MESSAGES.mrp);
    expect(price('Sale price')).toHaveAccessibleDescription(FIELD_MESSAGES.salePrice);
    expect(screen.getByRole('textbox', { name: 'Affiliate link' })).toHaveAccessibleDescription(
      FIELD_MESSAGES.affiliateUrl,
    );
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveAccessibleDescription(
      FIELD_MESSAGES.category,
    );
  });

  it('refuses a sale price above the MRP', async () => {
    const { user } = await setup('/gear/new');

    await user.type(price('MRP'), '1999');
    await user.type(price('Sale price'), '2499');
    await user.click(saveButton());

    await waitFor(() =>
      expect(price('Sale price')).toHaveAccessibleDescription(FIELD_MESSAGES.salePrice),
    );
    expect(price('MRP')).not.toHaveAttribute('aria-invalid');
  });

  it('accepts only an https affiliate link, and tests it in a new tab', async () => {
    const { user } = await setup('/gear/new');
    const link = field('Affiliate link');

    expect(screen.getByRole('button', { name: 'Test link' })).toBeDisabled();
    await user.type(link, 'http://example.com/storm-shell');
    expect(screen.getByRole('button', { name: 'Test link' })).toBeDisabled();
    await user.click(saveButton());
    await waitFor(() => expect(link).toHaveAccessibleDescription(FIELD_MESSAGES.affiliateUrl));

    await user.clear(link);
    await user.type(link, 'https://example.com/storm-shell');
    const test = screen.getByRole('link', { name: 'Test link' });
    expect(test).toHaveAttribute('href', 'https://example.com/storm-shell');
    expect(test).toHaveAttribute('target', '_blank');
    expect(test).toHaveAttribute('rel', 'noopener noreferrer');
    await waitFor(() => expect(link).not.toHaveAttribute('aria-invalid'));
  });

  it('creates the item with its taxonomies and tours, and moves to its page', async () => {
    const created = { ...GEAR, id: '6acb6f4b2fce015e85725099', name: 'Storm Shell' };
    const posted = record('post', '/admin/gear', () => success({ gear: created }, { status: 201 }));
    serveGear(created);
    const { user, router } = await setup('/gear/new');

    await user.type(field('Name'), 'Storm Shell');
    await user.type(field('Short description'), 'Packable rain shell');
    await user.type(price('MRP'), '4999');
    await user.type(price('Sale price'), '3999');
    await user.type(field('Affiliate link'), 'https://example.com/storm-shell');
    const category = screen.getByRole('combobox', { name: 'Category' });
    await waitFor(() => expect(within(category).getByText('Water Gear')).toBeInTheDocument());
    await user.selectOptions(category, 'Water Gear');
    await choose(user, 'Climates', 'High Altitude/Snow');
    await choose(user, 'Tags', 'Waterproof');
    await choose(user, 'Linked tours', `${DRAFT_TOUR.title} · PeakPulse (draft)`);
    await user.click(saveButton());

    expect(await screen.findByText('Storm Shell saved.')).toBeInTheDocument();
    expect(posted).toEqual([
      {
        name: 'Storm Shell',
        slug: 'storm-shell',
        shortDescription: 'Packable rain shell',
        description: '',
        images: [],
        mrp: 4999,
        salePrice: 3999,
        affiliateUrl: 'https://example.com/storm-shell',
        category: 'cat-water',
        climates: ['clim-snow'],
        tags: ['tag-waterproof'],
        tours: [DRAFT_TOUR.id],
        isActive: true,
      },
    ]);
    await waitFor(() => expect(currentUrl(router)).toBe(`/gear/${created.id}`));
  });
});

describe('GearEditPage: saved gear', () => {
  it('shows what the item is linked to and saves a change', async () => {
    serveGear();
    const patched = record('patch', `/admin/gear/${GEAR.id}`, (body) =>
      success({ gear: { ...GEAR, isActive: body.isActive } }),
    );
    const { user } = await setup(`/gear/${GEAR.id}`);

    expect(
      await screen.findByRole('button', { name: 'Remove Tropical/Beach' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Waterproof' })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: `Remove ${TOUR.title} · TideTrail` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('cat-water');
    expect(saveButton()).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: 'Active' }));
    await user.click(saveButton());

    expect(await screen.findByText(`${GEAR.name} saved.`)).toBeInTheDocument();
    expect(patched[0]).toMatchObject({
      isActive: false,
      category: 'cat-water',
      climates: ['clim-beach'],
      tags: ['tag-waterproof'],
      tours: [TOUR.id],
      images: GEAR.images,
    });
    await waitFor(() => expect(saveButton()).toBeDisabled());
  });

  it('puts the fields the server refused on their fields, in our words', async () => {
    serveGear();
    server.use(
      http.patch(api(`/admin/gear/${GEAR.id}`), () =>
        failure(400, 'VALIDATION_ERROR', {
          errors: [
            { field: 'climates', message: 'Raw climates message' },
            { field: 'tours', message: 'Raw tours message' },
          ],
        }),
      ),
    );
    const { user } = await setup(`/gear/${GEAR.id}`);

    await user.type(field('Short description'), '!');
    await user.click(saveButton());

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Climates' })).toHaveAccessibleDescription(
        FIELD_MESSAGES.climates,
      ),
    );
    expect(screen.getByRole('button', { name: 'Linked tours' })).toHaveAccessibleDescription(
      FIELD_MESSAGES.tours,
    );
    expect(screen.queryByText(/Raw/)).not.toBeInTheDocument();
  });

  it('marks the slug when another item already uses it', async () => {
    serveGear();
    server.use(http.patch(api(`/admin/gear/${GEAR.id}`), () => failure(409, 'DUPLICATE')));
    const { user } = await setup(`/gear/${GEAR.id}`);

    await user.clear(field('Slug'));
    await user.type(field('Slug'), 'trailhead-45l-trek-backpack');
    await user.click(saveButton());

    await waitFor(() => expect(field('Slug')).toHaveAccessibleDescription(DUPLICATE_SLUG_MESSAGE));
  });
});
