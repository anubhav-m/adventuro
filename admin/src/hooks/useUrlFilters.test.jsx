import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { useUrlFilters } from './useUrlFilters.js';

const DEFAULTS = Object.freeze({ q: '', sort: 'newest', page: '1' });

function Filters() {
  const { filters, setFilters, clearFilters } = useUrlFilters(DEFAULTS);
  return (
    <>
      <output>{JSON.stringify(filters)}</output>
      <button
        type="button"
        onClick={() => {
          setFilters({ q: 'bag' });
          setFilters({ sort: 'popular' });
        }}
      >
        Two at once
      </button>
      <button type="button" onClick={() => setFilters({ page: 3 })}>
        Page 3
      </button>
      <button type="button" onClick={() => setFilters({ sort: 'newest', q: null })}>
        Defaults
      </button>
      <button type="button" onClick={clearFilters}>
        Clear
      </button>
    </>
  );
}

const setup = (path) => ({
  ...renderRoutes([{ path: '/list', element: <Filters /> }], { path }),
  user: userEvent.setup(),
});

const shown = () => JSON.parse(screen.getByRole('status').textContent);

describe('useUrlFilters', () => {
  it('reads each filter from the URL, or its default', () => {
    setup('/list?q=tent&other=1');
    expect(shown()).toEqual({ q: 'tent', sort: 'newest', page: '1' });
  });

  it('keeps both of two changes made before the router has rendered the first', async () => {
    const { router, user } = setup('/list?page=4');

    await user.click(screen.getByRole('button', { name: 'Two at once' }));

    // Both filters are there, and a changed filter returned to the first page.
    await waitFor(() => expect(currentUrl(router)).toBe('/list?q=bag&sort=popular'));
    expect(shown()).toEqual({ q: 'bag', sort: 'popular', page: '1' });
  });

  it('keeps the filters when the page turns, and drops a value equal to its default', async () => {
    const { router, user } = setup('/list?q=bag&sort=popular');

    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/list?q=bag&sort=popular&page=3'));

    await user.click(screen.getByRole('button', { name: 'Defaults' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/list'));
  });

  it('clears every filter', async () => {
    const { router, user } = setup('/list?q=bag&sort=popular&page=2');

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(currentUrl(router)).toBe('/list'));
    expect(shown()).toEqual(DEFAULTS);
  });
});
