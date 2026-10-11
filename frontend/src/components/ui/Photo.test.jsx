import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Photo } from './Photo.jsx';

const IMAGE = { url: 'https://images.example.com/goa.jpg', path: null };
const fallback = <span>No photo</span>;

describe('Photo', () => {
  it('is a lazy image that stays hidden until it has loaded', () => {
    render(<Photo image={IMAGE} alt="Goa" fallback={fallback} />);
    const photo = screen.getByRole('img', { name: 'Goa' });

    expect(photo).toHaveAttribute('loading', 'lazy');
    expect(photo).toHaveClass('opacity-0');
    expect(screen.queryByText('No photo')).not.toBeInTheDocument();

    fireEvent.load(photo);
    expect(photo).toHaveClass('opacity-100');
  });

  it('loads at once when it is not lazy', () => {
    render(<Photo image={IMAGE} alt="Goa" lazy={false} />);
    expect(screen.getByRole('img', { name: 'Goa' })).not.toHaveAttribute('loading');
  });

  it('shows the fallback when there is no photo, or it fails to load', () => {
    const { rerender } = render(<Photo image={null} alt="Goa" fallback={fallback} />);
    expect(screen.getByText('No photo')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    rerender(<Photo image={IMAGE} alt="Goa" fallback={fallback} />);
    fireEvent.error(screen.getByRole('img', { name: 'Goa' }));
    expect(screen.getByText('No photo')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
