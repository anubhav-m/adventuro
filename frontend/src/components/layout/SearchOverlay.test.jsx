import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { GEAR, GOA_TOUR } from '../../test/fixtures.js';
import { currentUrl, renderRoutes } from '../../test/render.jsx';
import { api, failure, server, success } from '../../test/server.js';
import { PageLayout } from './PageLayout.jsx';

const TOURS = [
  GOA_TOUR,
  {
    ...GOA_TOUR,
    id: 'tour-south',
    slug: 'south-goa-slow',
    title: 'South Goa Slow',
    coverImage: null,
  },
];
const RESULTS = { tours: TOURS, gear: [GEAR[0]] };

const routes = [
  {
    Component: PageLayout,
    children: [
      { index: true, element: <h1>Home</h1> },
      {
        path: 'notes',
        element: (
          <h1>
            <input aria-label="Notes" />
          </h1>
        ),
      },
      { path: '*', element: <h1>Elsewhere</h1> },
    ],
  },
];

// Answers GET /search and records every term asked for.
const mockSearch = (resolve = () => RESULTS) => {
  const terms = [];
  server.use(
    http.get(api('/search'), ({ request }) => {
      const q = new URL(request.url).searchParams.get('q');
      terms.push(q);
      return success(resolve(q));
    }),
  );
  return terms;
};

const setup = (path = '/') => {
  const terms = mockSearch();
  const view = renderRoutes(routes, { path });
  return { ...view, terms, user: userEvent.setup() };
};

const openSearch = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Search' }));
  return screen.getByRole('searchbox', { name: 'Search tours and gear' });
};

const dialog = () => within(screen.getByRole('dialog', { name: 'Search' }));
const group = (name) => dialog().getByRole('region', { name });

describe('SearchOverlay', () => {
  it('opens from the navbar icon with focus in the search box', async () => {
    const { user } = setup();
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toHaveAttribute('aria-keyshortcuts', '/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const box = await openSearch(user);

    expect(box).toHaveFocus();
    expect(dialog().getByText(/Type at least 2 characters/)).toBeInTheDocument();
  });

  it('opens on the "/" key without typing it, but not while typing elsewhere', async () => {
    const { user } = setup('/notes');

    const notes = screen.getByRole('textbox', { name: 'Notes' });
    await user.type(notes, 'a/b');
    expect(notes).toHaveValue('a/b');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    notes.blur();
    await user.keyboard('{Control>}/{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.keyboard('/');
    const box = screen.getByRole('searchbox', { name: 'Search tours and gear' });
    expect(box).toHaveFocus();
    expect(box).toHaveValue('');
  });

  it('waits for a pause and at least two characters before it asks', async () => {
    const { user, terms } = setup();
    const box = await openSearch(user);

    await user.type(box, 'g');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(terms).toEqual([]);
    expect(dialog().getByText(/Type at least 2 characters/)).toBeInTheDocument();

    await user.type(box, 'oa ');
    expect(terms).toEqual([]);
    await dialog().findByRole('link', { name: /Goa Coastal Escape/ });
    // One request for the whole burst of typing, with the term trimmed.
    expect(terms).toEqual(['goa']);
  });

  it('groups results under Tours and Gear, each a link to where it opens', async () => {
    const { user } = setup();
    await user.type(await openSearch(user), 'goa');
    await dialog().findByRole('link', { name: /Goa Coastal Escape/ });

    const tours = within(group('Tours')).getAllByRole('link');
    expect(tours.map((link) => link.getAttribute('href'))).toEqual([
      '/tours/goa-coastal-escape',
      '/tours/south-goa-slow',
    ]);
    expect(tours[0]).toHaveTextContent('Goa Coastal Escape');
    expect(tours[0]).toHaveTextContent('North Goa, Goa');
    expect(tours[0]).toHaveTextContent('from₹14,999');

    const [gear] = within(group('Gear')).getAllByRole('link');
    expect(gear).toHaveAttribute('href', '/gear?q=DryTide+20L+Roll-Top+Dry+Bag');
    expect(gear).toHaveTextContent('₹899');
  });

  it('leaves out a group with no results, and says so when nothing matches', async () => {
    mockSearch((q) => (q === 'goa' ? { tours: TOURS, gear: [] } : { tours: [], gear: [] }));
    const view = renderRoutes(routes);
    const user = userEvent.setup();
    const box = await openSearch(user);

    await user.type(box, 'goa');
    await dialog().findByRole('link', { name: /Goa Coastal Escape/ });
    expect(dialog().queryByRole('region', { name: 'Gear' })).not.toBeInTheDocument();

    await user.clear(box);
    await user.type(box, 'zzz');
    expect(await dialog().findByText('No tours or gear match “zzz”.')).toBeInTheDocument();
    expect(dialog().queryByRole('link')).not.toBeInTheDocument();
    view.unmount();
  });

  it('moves through the results with the arrow keys and back up to the box', async () => {
    const { user } = setup();
    const box = await openSearch(user);
    await user.type(box, 'goa');
    const first = await dialog().findByRole('link', { name: /Goa Coastal Escape/ });
    const links = dialog().getAllByRole('link');

    await user.keyboard('{ArrowDown}');
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(links[2]).toHaveFocus();
    // The last result is the end of the list.
    await user.keyboard('{ArrowDown}');
    expect(links[2]).toHaveFocus();

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(box).toHaveFocus();
  });

  it('opens the focused result on Enter and closes', async () => {
    const { user, router } = setup();
    await user.type(await openSearch(user), 'goa');
    await dialog().findByRole('link', { name: /Goa Coastal Escape/ });

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');

    await waitFor(() => expect(currentUrl(router)).toBe('/gear?q=DryTide+20L+Roll-Top+Dry+Bag'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the first result on Enter in the box', async () => {
    const { user, router } = setup();
    const box = await openSearch(user);

    // With nothing found yet, Enter does nothing.
    await user.keyboard('{Enter}');
    expect(currentUrl(router)).toBe('/');

    await user.type(box, 'goa');
    await dialog().findByRole('link', { name: /Goa Coastal Escape/ });
    await user.keyboard('{Enter}');

    await waitFor(() => expect(currentUrl(router)).toBe('/tours/goa-coastal-escape'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape, hands focus back, and starts empty next time', async () => {
    const { user } = setup();
    await user.type(await openSearch(user), 'goa');
    await dialog().findByRole('link', { name: /Goa Coastal Escape/ });

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
    expect(await openSearch(user)).toHaveValue('');
  });

  it('shows a friendly error when the search fails', async () => {
    server.use(http.get(api('/search'), () => failure(429, 'RATE_LIMITED')));
    renderRoutes(routes);
    const user = userEvent.setup();

    await user.type(await openSearch(user), 'goa');

    const alert = await dialog().findByRole('alert');
    expect(alert).toHaveTextContent("You're going a bit fast.");
    expect(alert).not.toHaveTextContent('Raw server message');
  });
});
