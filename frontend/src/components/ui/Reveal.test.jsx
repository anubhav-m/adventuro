import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Reveal } from './Reveal.jsx';

// A stand-in for the browser's observer that the test fires by hand.
const stubObserver = () => {
  const observers = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback) {
        this.callback = callback;
        this.disconnect = vi.fn();
        observers.push(this);
      }

      observe(element) {
        this.element = element;
      }
    },
  );
  return observers;
};

const report = (observer, { isIntersecting = false, top = 900 } = {}) =>
  act(() => observer.callback([{ isIntersecting, boundingClientRect: { top } }]));

describe('Reveal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is revealed from the start where the browser cannot observe the screen', () => {
    render(<Reveal>Trips</Reveal>);

    expect(screen.getByText('Trips')).toHaveAttribute('data-reveal', 'rise');
    expect(screen.getByText('Trips')).toHaveAttribute('data-revealed');
  });

  it('waits until it enters the screen, and stays revealed once scrolled past', () => {
    const observers = stubObserver();
    render(<Reveal>Trips</Reveal>);
    const block = screen.getByText('Trips');
    const [observer] = observers;

    expect(observer.element).toBe(block);
    expect(block).not.toHaveAttribute('data-revealed');

    report(observer);
    expect(block).not.toHaveAttribute('data-revealed');

    report(observer, { isIntersecting: true });
    expect(block).toHaveAttribute('data-revealed');

    report(observer, { top: -400 });
    expect(block).toHaveAttribute('data-revealed');
    expect(observers).toHaveLength(1);
  });

  it('goes out of sight when it drops back below the screen, and reveals again', () => {
    const observers = stubObserver();
    render(<Reveal>Trips</Reveal>);
    const block = screen.getByText('Trips');
    const [observer] = observers;

    report(observer, { isIntersecting: true });
    report(observer);
    expect(block).not.toHaveAttribute('data-revealed');

    report(observer, { isIntersecting: true });
    expect(block).toHaveAttribute('data-revealed');
    expect(observer.disconnect).not.toHaveBeenCalled();
  });

  it('stops watching when it is removed', () => {
    const observers = stubObserver();
    const { unmount } = render(<Reveal>Trips</Reveal>);
    unmount();

    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it('renders the given element, passes its props on, and marks a staggered group', () => {
    render(
      <Reveal as="ul" stagger className="grid" aria-label="Tours">
        <li>Goa</li>
      </Reveal>,
    );
    const list = screen.getByRole('list', { name: 'Tours' });

    expect(list).toHaveAttribute('data-reveal', 'stagger');
    expect(list).toHaveClass('grid');
  });
});
