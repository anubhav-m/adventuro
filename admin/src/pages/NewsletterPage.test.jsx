import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { captureDownloads } from '../test/downloads.js';
import { pageMeta, SUBSCRIBERS } from '../test/fixtures.js';
import { currentUrl, renderApp } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';
import { NewsletterPage } from './NewsletterPage.jsx';

const downloads = captureDownloads();

const serveSubscribers = (meta = pageMeta(SUBSCRIBERS.length)) => {
  const queries = [];
  server.use(
    http.get(api('/admin/newsletter'), ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return success({ subscribers: SUBSCRIBERS }, { meta });
    }),
  );
  return queries;
};

const setup = async (path = '/newsletter') => {
  const view = renderApp(<NewsletterPage />, { path });
  await screen.findByText(SUBSCRIBERS[0].email);
  return { user: userEvent.setup(), ...view };
};

// Subscribers as the export reads them: page 1 of 2 holds 50, page 2 one more, and one email
// that a spreadsheet would run as a formula.
const ALL_SUBSCRIBERS = [
  ...Array.from({ length: 50 }, (_, index) => ({
    id: `sub-${index}`,
    email: `reader${index}@example.com`,
    createdAt: '2026-10-12T06:30:00.000Z',
  })),
  {
    id: 'sub-evil',
    email: '=HYPERLINK("http://evil.example")@x.com',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

const serveExportPages = () => {
  const pages = [];
  server.use(
    http.get(api('/admin/newsletter'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Number(params.get('page'));
      const limit = Number(params.get('limit'));
      pages.push({ page, limit });
      return success(
        { subscribers: ALL_SUBSCRIBERS.slice((page - 1) * limit, page * limit) },
        { meta: pageMeta(ALL_SUBSCRIBERS.length, { page, limit }) },
      );
    }),
  );
  return pages;
};

describe('NewsletterPage', () => {
  it('lists the subscribers with when they signed up', async () => {
    serveSubscribers();
    await setup();

    const table = screen.getByRole('table', { name: 'Subscribers' });
    const rows = within(table)
      .getAllByRole('row')
      .map((row) => [...row.cells].map((c) => c.textContent));
    expect(rows).toEqual([
      ['Email', 'Subscribed'],
      ['reader.one@example.com', '12 Oct 2026, 12:00 PM'],
      ['reader.two@example.com', '11 Oct 2026, 12:00 PM'],
    ]);
    await waitFor(() => expect(document.title).toBe('Newsletter · Adventuro Admin'));
  });

  it('turns pages through the URL', async () => {
    const queries = serveSubscribers(pageMeta(45));
    const { user, router } = await setup();

    await user.click(screen.getByRole('button', { name: 'Page 3' }));

    await waitFor(() => expect(queries.at(-1)).toEqual({ page: '3', limit: '20' }));
    expect(currentUrl(router)).toBe('/newsletter?page=3');
  });

  it('exports every page as one CSV, with formulas made plain text', async () => {
    serveSubscribers();
    const { user } = await setup();
    const pages = serveExportPages();

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByText('Exported 51 subscribers.')).toBeInTheDocument();
    expect(pages).toEqual([
      { page: 1, limit: 50 },
      { page: 2, limit: 50 },
    ]);
    expect(downloads).toHaveLength(1);
    const [{ filename, blob }] = downloads;
    expect(filename).toMatch(/^adventuro-newsletter-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(blob.type).toBe('text/csv;charset=utf-8');
    const lines = (await blob.text()).replace(/^\uFEFF/, '').split('\r\n');
    expect(lines).toHaveLength(53);
    expect(lines[0]).toBe('"Email","Subscribed at (UTC)"');
    expect(lines[1]).toBe('"reader0@example.com","2026-10-12T06:30:00.000Z"');
    expect(lines[51]).toBe(
      `"'=HYPERLINK(""http://evil.example"")@x.com","2026-10-01T00:00:00.000Z"`,
    );
    expect(lines[52]).toBe('');
  });

  it('says in our words when the export fails, and saves nothing', async () => {
    serveSubscribers();
    const { user } = await setup();
    server.use(http.get(api('/admin/newsletter'), () => failure(429, 'RATE_LIMITED')));

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(
      await screen.findByText("You're going a bit fast. Please wait a moment and try again."),
    ).toBeInTheDocument();
    expect(downloads).toEqual([]);
  });

  it('says when there are no subscribers yet', async () => {
    server.use(
      http.get(api('/admin/newsletter'), () => success({ subscribers: [] }, { meta: pageMeta(0) })),
    );
    renderApp(<NewsletterPage />, { path: '/newsletter' });

    expect(await screen.findByText('No subscribers yet.')).toBeInTheDocument();
  });
});
