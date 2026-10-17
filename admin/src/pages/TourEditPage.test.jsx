import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { DUPLICATE_SLUG_MESSAGE } from '../lib/errors.js';
import { FIELD_MESSAGES } from '../lib/schemas.js';
import { serveContentLists } from '../test/contentApi.js';
import { GEAR_LIST, pageMeta, PEAKPULSE_ITEM, TOUR } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, success } from '../test/server.js';
import { TourEditPage } from './TourEditPage.jsx';

const routes = [
  { path: '/tours', element: <h1>Tours list</h1> },
  { path: '/tours/new', element: <TourEditPage /> },
  { path: '/tours/:id', element: <TourEditPage /> },
  { path: '/gear/:id', element: <h1>Gear page</h1> },
];

const serveTour = (tour = TOUR) =>
  server.use(http.get(api(`/admin/tours/${tour.id}`), () => success({ tour })));

// Every test has the lists behind it; a test's own handlers, added later, win over them.
beforeEach(() => serveContentLists());

const setup = async (path) => {
  const view = renderRoutes(routes, { path });
  await screen.findByRole('heading', { level: 1, name: /New tour|Goa Coastal Escape/ });
  return { user: userEvent.setup(), ...view };
};

const tab = (name) => screen.getByRole('tab', { name: new RegExp(`^${name}`) });
const flaggedTabs = () =>
  screen
    .getAllByRole('tab')
    .filter((element) => element.textContent.includes('(needs attention)'))
    .map((element) => element.textContent.replace(' (needs attention)', ''));
const field = (name) => screen.getByRole('textbox', { name });
const saveButton = () => screen.getByRole('button', { name: 'Save' });

// Fills every field a new tour needs, tab by tab, as an admin would.
const fillNewTour = async (user) => {
  const vertical = screen.getByRole('combobox', { name: 'Vertical' });
  await waitFor(() => expect(within(vertical).getByText('PeakPulse')).toBeInTheDocument());
  await user.selectOptions(vertical, 'PeakPulse');
  await user.type(field('Title'), 'Spiti Snow Trek');
  await user.type(field('State'), 'Himachal Pradesh');
  await user.type(field('Destination'), 'Kaza');
  await user.type(screen.getByRole('spinbutton', { name: 'Duration in days' }), '6');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Difficulty' }), 'Challenging');
  await user.type(field('Overview'), 'Six days in the snow.');

  await user.click(tab('Experience'));
  await user.type(field('Activity'), 'Snow camping');
  await user.type(field('What happens'), 'A night on the ice.');

  await user.click(tab('Packages'));
  await user.type(field('Name'), 'Essential');
  await user.type(screen.getByRole('spinbutton', { name: 'Price per person' }), '30000');

  await user.click(tab('Reporting'));
  await user.type(field('Location'), 'Manali bus stand');
  fireEvent.change(screen.getByLabelText('Reporting time'), { target: { value: '07:30' } });
};

describe('TourEditPage: a new tour', () => {
  it('follows the title with the slug until the slug is edited', async () => {
    const { user } = await setup('/tours/new');

    await user.type(field('Title'), 'Goa: Coast & Café');
    expect(field('Slug')).toHaveValue('goa-coast-and-cafe');
    expect(field('Slug')).toHaveAccessibleDescription('Follows the title until you edit it.');

    await user.clear(field('Slug'));
    await user.type(field('Slug'), 'goa-cafe');
    await user.type(field('Title'), ' Trail');
    expect(field('Slug')).toHaveValue('goa-cafe');

    // Emptying the slug hands it back to the title.
    await user.clear(field('Slug'));
    await user.type(field('Title'), 's');
    expect(field('Slug')).toHaveValue('goa-coast-and-cafe-trails');
  });

  it('flags every tab with a field to fix and stays on the open one when it is flagged', async () => {
    const { user } = await setup('/tours/new');
    expect(saveButton()).toBeDisabled();

    await user.type(field('Title'), 'Spiti Snow Trek');
    await user.click(saveButton());

    expect(
      await screen.findByText(
        "Some details don't look right. Please check the highlighted fields.",
      ),
    ).toBeInTheDocument();
    expect(flaggedTabs()).toEqual(['Basics', 'Experience', 'Packages', 'Reporting']);
    expect(tab('Basics')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('combobox', { name: 'Vertical' })).toHaveAccessibleDescription(
      FIELD_MESSAGES.vertical,
    );
    expect(field('State')).toHaveAccessibleDescription(FIELD_MESSAGES.state);
    expect(
      screen.getByRole('spinbutton', { name: 'Duration in days' }),
    ).toHaveAccessibleDescription(FIELD_MESSAGES.durationDays);

    // The signature activity is required: every tour has one.
    await user.click(tab('Experience'));
    expect(field('Activity')).toHaveAccessibleDescription(
      FIELD_MESSAGES['signatureActivity.title'],
    );

    await user.click(tab('Packages'));
    expect(field('Name')).toHaveAccessibleDescription(FIELD_MESSAGES['tiers.*.name']);
    expect(
      screen.getByRole('spinbutton', { name: 'Price per person' }),
    ).toHaveAccessibleDescription(FIELD_MESSAGES['tiers.*.pricePerPerson']);

    await user.click(tab('Reporting'));
    expect(screen.getByLabelText('Reporting time')).toHaveAccessibleDescription(
      FIELD_MESSAGES['reporting.time'],
    );
  });

  it('opens the first flagged tab when the open one has nothing to fix', async () => {
    const { user, router } = await setup('/tours/new');
    await user.type(field('Title'), 'Spiti Snow Trek');

    await user.click(tab('Media'));
    await user.click(saveButton());

    await waitFor(() => expect(tab('Basics')).toHaveAttribute('aria-selected', 'true'));
    expect(currentUrl(router)).toBe('/tours/new');
  });

  it('refuses packages with the same name and days without a title', async () => {
    const { user } = await setup('/tours/new');
    await fillNewTour(user);

    await user.click(tab('Packages'));
    await user.click(screen.getByRole('button', { name: 'Add package' }));
    const [, second] = screen.getAllByRole('textbox', { name: 'Name' });
    await user.type(second, 'essential');
    await user.type(screen.getAllByRole('spinbutton', { name: 'Price per person' })[1], '40000');
    await user.click(tab('Itinerary'));
    await user.click(screen.getByRole('button', { name: 'Add day' }));
    await user.click(saveButton());

    await waitFor(() => expect(flaggedTabs()).toEqual(['Itinerary', 'Packages']));
    expect(field('Title')).toHaveAccessibleDescription(FIELD_MESSAGES['itinerary.*.title']);
    await user.click(tab('Packages'));
    const [first, repeated] = screen.getAllByRole('textbox', { name: 'Name' });
    expect(first).not.toHaveAttribute('aria-invalid');
    expect(repeated).toHaveAccessibleDescription(FIELD_MESSAGES['tiers.*.name']);
  });

  it('refuses a reporting time that is not HH:mm', async () => {
    const { user } = await setup('/tours/new');
    await fillNewTour(user);

    fireEvent.change(screen.getByLabelText('Reporting time'), { target: { value: '' } });
    await user.click(saveButton());

    await waitFor(() => expect(flaggedTabs()).toEqual(['Reporting']));
    expect(screen.getByLabelText('Reporting time')).toHaveAccessibleDescription(
      FIELD_MESSAGES['reporting.time'],
    );
  });

  it('creates the tour as a draft and moves to its page', async () => {
    const created = { ...TOUR, id: '6acb6f4b2fce015e85724099', title: 'Spiti Snow Trek' };
    const posted = record('post', '/admin/tours', () =>
      success({ tour: created }, { status: 201 }),
    );
    serveTour(created);
    const { user, router } = await setup('/tours/new');

    await fillNewTour(user);
    await user.click(saveButton());

    expect(await screen.findByText('Spiti Snow Trek saved.')).toBeInTheDocument();
    expect(posted).toEqual([
      {
        vertical: PEAKPULSE_ITEM.id,
        title: 'Spiti Snow Trek',
        slug: 'spiti-snow-trek',
        state: 'Himachal Pradesh',
        destination: 'Kaza',
        tagline: '',
        overview: 'Six days in the snow.',
        durationDays: 6,
        difficulty: 'challenging',
        isPublished: false,
        coverImage: null,
        gallery: [],
        signatureActivity: { title: 'Snow camping', description: 'A night on the ice.' },
        topActivities: [],
        itinerary: [],
        inclusions: [],
        exclusions: [],
        tiers: [{ name: 'Essential', description: '', pricePerPerson: 30000 }],
        reporting: { location: 'Manali bus stand', address: '', time: '07:30' },
      },
    ]);
    await waitFor(() => expect(currentUrl(router)).toBe(`/tours/${created.id}`));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no linked gear until it is saved', async () => {
    const { user } = await setup('/tours/new');

    await user.click(tab('Gear'));

    expect(screen.getByRole('heading', { name: 'Save the tour first.' })).toBeInTheDocument();
  });
});

describe('TourEditPage: a saved tour', () => {
  it('saves the changes, keeping each package’s id, and is clean again', async () => {
    const patched = record('patch', `/admin/tours/${TOUR.id}`, (body) =>
      success({ tour: { ...TOUR, ...body, vertical: TOUR.vertical } }),
    );
    serveTour();
    const { user } = await setup(`/tours/${TOUR.id}`);

    expect(field('Slug')).toHaveAccessibleDescription(
      'Part of the web address. Changing it breaks old links.',
    );
    await user.type(field('Title'), ' Deluxe');
    expect(field('Slug')).toHaveValue(TOUR.slug);
    await user.click(tab('Reporting'));
    fireEvent.change(screen.getByLabelText('Reporting time'), { target: { value: '06:45' } });
    await user.click(saveButton());

    expect(await screen.findByText('Goa Coastal Escape Deluxe saved.')).toBeInTheDocument();
    expect(patched).toHaveLength(1);
    expect(patched[0]).toMatchObject({
      title: 'Goa Coastal Escape Deluxe',
      slug: TOUR.slug,
      vertical: TOUR.vertical.id,
      reporting: { location: 'Dabolim Airport', address: 'Goa', time: '06:45' },
      tiers: TOUR.tiers,
      gallery: TOUR.gallery,
    });
    await waitFor(() => expect(saveButton()).toBeDisabled());
  });

  it('puts the fields the server refused on their tabs, in our words', async () => {
    server.use(
      http.patch(api(`/admin/tours/${TOUR.id}`), () =>
        failure(400, 'VALIDATION_ERROR', {
          errors: [
            { field: 'reporting.time', message: 'Raw time message' },
            { field: 'tiers.1.name', message: 'Raw tier message' },
          ],
        }),
      ),
    );
    serveTour();
    const { user } = await setup(`/tours/${TOUR.id}`);

    await user.type(field('Tagline'), '!');
    await user.click(saveButton());

    await waitFor(() => expect(flaggedTabs()).toEqual(['Packages', 'Reporting']));
    expect(
      screen.getByText("Some details don't look right. Please check the highlighted fields."),
    ).toBeInTheDocument();
    await user.click(tab('Packages'));
    expect(screen.getAllByRole('textbox', { name: 'Name' })[1]).toHaveAccessibleDescription(
      FIELD_MESSAGES['tiers.*.name'],
    );
    await user.click(tab('Reporting'));
    expect(screen.getByLabelText('Reporting time')).toHaveAccessibleDescription(
      FIELD_MESSAGES['reporting.time'],
    );
    expect(screen.queryByText(/Raw/)).not.toBeInTheDocument();
  });

  it('marks the slug when another item already uses it', async () => {
    server.use(http.patch(api(`/admin/tours/${TOUR.id}`), () => failure(409, 'DUPLICATE')));
    serveTour();
    const { user } = await setup(`/tours/${TOUR.id}`);

    await user.clear(field('Slug'));
    await user.type(field('Slug'), 'gokarna-beach-trek');
    await user.click(saveButton());

    await waitFor(() => expect(field('Slug')).toHaveAccessibleDescription(DUPLICATE_SLUG_MESSAGE));
    expect(
      screen.getByText('Something with this name already exists. Try a different name.'),
    ).toBeInTheDocument();
    expect(flaggedTabs()).toEqual(['Basics']);
  });

  it('remembers the open tab in the URL', async () => {
    serveTour();
    const { user, router } = await setup(`/tours/${TOUR.id}?tab=itinerary`);

    expect(tab('Itinerary')).toHaveAttribute('aria-selected', 'true');
    await user.click(tab('Basics'));

    expect(currentUrl(router)).toBe(`/tours/${TOUR.id}`);
  });

  it('lists the gear linked to the tour, with a link to edit each', async () => {
    serveTour();
    const seen = [];
    server.use(
      http.get(api('/admin/gear'), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('tour'));
        return success({ gear: GEAR_LIST.slice(0, 1) }, { meta: pageMeta(1) });
      }),
    );
    const { user } = await setup(`/tours/${TOUR.id}`);

    await user.click(tab('Gear'));

    const table = await screen.findByRole('table', { name: 'Linked gear' });
    expect(within(table).getByText(GEAR_LIST[0].name)).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: `Edit ${GEAR_LIST[0].name}` })).toHaveAttribute(
      'href',
      `/gear/${GEAR_LIST[0].id}`,
    );
    expect(seen).toEqual([TOUR.id]);
  });

  it('asks before leaving with unsaved changes', async () => {
    serveTour();
    const { user, router } = await setup(`/tours/${TOUR.id}`);

    await user.type(field('Tagline'), '!');
    await user.click(screen.getByRole('link', { name: 'All tours' }));
    await user.click(await screen.findByRole('button', { name: 'Keep editing' }));
    expect(currentUrl(router)).toBe(`/tours/${TOUR.id}`);

    await user.click(screen.getByRole('link', { name: 'All tours' }));
    await user.click(await screen.findByRole('button', { name: 'Leave' }));
    expect(await screen.findByRole('heading', { name: 'Tours list' })).toBeInTheDocument();
  });

  it('keeps its title when the tour cannot be found', async () => {
    server.use(http.get(api('/admin/tours/missing'), () => failure(404, 'NOT_FOUND')));
    renderRoutes(routes, { path: '/tours/missing' });

    expect(
      await screen.findByText("We couldn't find what you're looking for."),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Edit tour' })).toBeInTheDocument();
  });
});
