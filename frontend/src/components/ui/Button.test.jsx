import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArrowRight } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render.jsx';
import { Button } from './Button.jsx';

describe('Button', () => {
  it('is a plain button by default: primary, medium, type="button"', () => {
    renderApp(<Button>Book Now</Button>);
    const button = screen.getByRole('button', { name: 'Book Now' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-primary', 'text-on-primary', 'h-13', 'rounded-pill');
  });

  it.each([
    ['primary', ['bg-primary', 'text-on-primary']],
    ['secondary', ['border-text', 'text-text']],
    ['on-accent', ['bg-on-accent', 'text-accent']],
    ['ghost', ['border-transparent', 'text-text']],
    ['danger', ['border-danger', 'text-danger']],
  ])('applies the %s variant', (variant, classes) => {
    renderApp(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(...classes);
  });

  it('has a small size that is still a 44px touch target', () => {
    renderApp(<Button size="sm">Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('h-11');
  });

  it('calls onClick, and not when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = renderApp(<Button onClick={onClick}>Go</Button>);

    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(null);
    renderApp(
      <Button onClick={onClick} disabled>
        Stop
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('while loading it is disabled, busy, and keeps its label', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderApp(
      <Button loading icon={ArrowRight} onClick={onClick}>
        Confirm Booking
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Confirm Booking' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.animate-spin')).not.toBeNull();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders icons as decoration', () => {
    renderApp(<Button iconRight={ArrowRight}>Explore</Button>);
    const icon = screen.getByRole('button', { name: 'Explore' }).querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('is a router link with `to` and an anchor with `href`', () => {
    renderApp(
      <>
        <Button to="/gear">Explore Gear Store</Button>
        <Button href="/api/v1/gear/1/go" target="_blank" rel="noopener noreferrer sponsored">
          Buy
        </Button>
      </>,
    );

    expect(screen.getByRole('link', { name: 'Explore Gear Store' })).toHaveAttribute(
      'href',
      '/gear',
    );
    const buy = screen.getByRole('link', { name: 'Buy' });
    expect(buy).toHaveAttribute('href', '/api/v1/gear/1/go');
    expect(buy).toHaveAttribute('rel', 'noopener noreferrer sponsored');
  });

  it('can submit a form', () => {
    renderApp(<Button type="submit">Subscribe</Button>);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toHaveAttribute('type', 'submit');
  });
});
