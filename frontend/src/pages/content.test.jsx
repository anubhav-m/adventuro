import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { routes } from '../router.jsx';
import { renderRoutes } from '../test/render.jsx';

const main = () => within(screen.getByRole('main'));
const headings = (level) =>
  main()
    .getAllByRole('heading', { level })
    .map((heading) => heading.textContent);

describe('AboutPage', () => {
  it('tells the story: the problem, what Adventuro is, its philosophy, verticals and promise', async () => {
    renderRoutes(routes, { path: '/about' });
    await screen.findByRole('heading', { level: 1, name: 'Our story' });

    expect(document.title).toBe('Our story · Adventuro');
    expect(
      main().getByText('We don’t just take you there. We make you experience it.'),
    ).toBeInTheDocument();
    expect(headings(2)).toEqual([
      'The problem with packages',
      'What Adventuro is',
      'Experienced, not simply visited',
      'Five verticals and one grand tour',
      'Our promise',
    ]);
  });

  it('links each of the five verticals and Grand India Tour', async () => {
    renderRoutes(routes, { path: '/about' });
    await screen.findByRole('heading', { level: 1, name: 'Our story' });
    const roster = within(
      screen.getByRole('region', { name: 'Five verticals and one grand tour' }),
    );

    expect(roster.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/v/tidetrail',
      '/v/goldensaga',
      '/v/peakpulse',
      '/v/elitescape',
      '/v/urbanecho',
      '/v/grand-india-tour',
    ]);
    expect(roster.getAllByRole('listitem')[0]).toHaveAttribute('data-vertical', 'tidetrail');
  });

  it('gives the promise in order, and a way on', async () => {
    renderRoutes(routes, { path: '/about' });
    await screen.findByRole('heading', { level: 1, name: 'Our story' });
    const promise = within(screen.getByRole('region', { name: 'Our promise' }));

    expect(
      promise.getAllByRole('listitem').map((step) => step.textContent.replace(/^\d/, '')),
    ).toEqual([
      expect.stringMatching(/^Discover/),
      expect.stringMatching(/^Experience/),
      expect.stringMatching(/^Equip/),
      expect.stringMatching(/^Remember/),
    ]);
    expect(promise.getByRole('link', { name: 'Choose your adventure' })).toHaveAttribute(
      'href',
      '/#choose-your-adventure',
    );
    expect(promise.getByRole('link', { name: 'Explore the gear store' })).toHaveAttribute(
      'href',
      '/gear',
    );
  });
});

describe('StaticPage', () => {
  it.each([
    ['/privacy-terms', 'Privacy & Terms', 'What we collect'],
    ['/cancellation-refund', 'Cancellation & Refund', 'Cancelling a booking'],
    ['/affiliate-disclosure', 'Affiliate Disclosure', 'Gear links are affiliate links'],
  ])('%s renders its policy, marked as a draft', async (path, title, firstSection) => {
    renderRoutes(routes, { path });
    await screen.findByRole('heading', { level: 1, name: title });

    expect(document.title).toBe(`${title} · Adventuro`);
    expect(main().getByText('Draft copy, awaiting client and legal review')).toBeInTheDocument();
    expect(headings(2)[0]).toBe(firstSection);
    expect(headings(2).at(-1)).toBe('Contact');
    expect(main().getByRole('link', { name: 'hello@adventuro.example' })).toHaveAttribute(
      'href',
      'mailto:hello@adventuro.example',
    );
  });

  it('lists what is collected as a list', async () => {
    renderRoutes(routes, { path: '/privacy-terms' });
    await screen.findByRole('heading', { level: 1, name: 'Privacy & Terms' });
    const collected = within(screen.getByRole('region', { name: 'What we collect' }));

    expect(collected.getAllByRole('listitem')).toHaveLength(5);
  });

  it('is reached from the footer', async () => {
    renderRoutes(routes, { path: '/about' });
    await screen.findByRole('heading', { level: 1, name: 'Our story' });
    const support = within(screen.getByRole('navigation', { name: 'Support & safety' }));

    expect(support.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/privacy-terms',
      '/cancellation-refund',
      '/affiliate-disclosure',
    ]);
  });
});
