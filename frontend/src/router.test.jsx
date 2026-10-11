import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoutes } from './test/render.jsx';
import { routes } from './router.jsx';

const VERTICAL_NAMES = [
  'TideTrail',
  'GoldenSaga',
  'PeakPulse',
  'EliteScape',
  'UrbanEcho',
  'Grand India Tour',
];

describe('app shell', () => {
  it('renders the not-found page inside the layout for an unknown path', async () => {
    renderRoutes(routes, { path: '/no/such/page' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This trail isn’t on the map.' }),
    ).toBeInTheDocument();
    expect(screen.getByText("We couldn't find what you're looking for.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Page not found · Adventuro');
  });

  it('has a skip link, a main landmark and the navbar', async () => {
    renderRoutes(routes, { path: '/nowhere' });
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');

    const navbar = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(navbar.getByRole('link', { name: 'Adventuro home' })).toBeInTheDocument();
    expect(navbar.getByRole('button', { name: 'Browse verticals' })).toBeInTheDocument();
    expect(navbar.getByRole('link', { name: 'Gear Store' })).toHaveAttribute('href', '/gear');
    expect(navbar.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about');
    expect(navbar.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    expect(await navbar.findByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin');
  });

  it('has a footer with every section from the UI flow', async () => {
    renderRoutes(routes, { path: '/nowhere' });
    await screen.findByRole('heading', { level: 1 });
    const footer = within(screen.getByRole('contentinfo'));

    expect(footer.getByText('From Coast to Camp, Peak to Palace.')).toBeInTheDocument();
    expect(footer.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();

    const verticals = within(footer.getByRole('navigation', { name: 'Verticals' }));
    expect(verticals.getAllByRole('link').map((link) => link.textContent)).toEqual(VERTICAL_NAMES);
    expect(verticals.getByRole('link', { name: 'PeakPulse' })).toHaveAttribute(
      'href',
      '/v/peakpulse',
    );

    const explore = within(footer.getByRole('navigation', { name: 'Explore' }));
    expect(explore.getByRole('link', { name: 'Gear Store' })).toHaveAttribute('href', '/gear');
    expect(explore.getByRole('link', { name: 'My Bookings' })).toHaveAttribute(
      'href',
      '/account/bookings',
    );

    const support = within(footer.getByRole('navigation', { name: 'Support & safety' }));
    expect(support.getByRole('link', { name: 'Privacy & Terms' })).toHaveAttribute(
      'href',
      '/privacy-terms',
    );
    expect(support.getByRole('link', { name: 'Cancellation & Refund' })).toHaveAttribute(
      'href',
      '/cancellation-refund',
    );
    expect(support.getByRole('link', { name: 'Affiliate Disclosure' })).toHaveAttribute(
      'href',
      '/affiliate-disclosure',
    );

    const contact = within(footer.getByRole('navigation', { name: 'Contact' }));
    const [email, ...social] = contact.getAllByRole('link');
    expect(email.getAttribute('href')).toMatch(/^mailto:/);
    expect(email).not.toHaveAttribute('target');
    for (const link of social) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
