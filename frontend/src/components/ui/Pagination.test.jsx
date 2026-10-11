import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination.jsx';

const setup = (page, totalPages) => {
  const onPageChange = vi.fn();
  render(<Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />);
  return { onPageChange, user: userEvent.setup() };
};

const pageNumbers = () =>
  within(screen.getByRole('list'))
    .getAllByRole('button')
    .map((button) => button.textContent);

describe('Pagination', () => {
  it.each([0, 1])('renders nothing for %i pages', (totalPages) => {
    setup(1, totalPages);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('lists every page when there are few, and marks the current one', () => {
    setup(2, 4);

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(pageNumbers()).toEqual(['1', '2', '3', '4']);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 3' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    [1, ['1', '2', '9']],
    [2, ['1', '2', '3', '9']],
    [5, ['1', '4', '5', '6', '9']],
    [8, ['1', '7', '8', '9']],
    [9, ['1', '8', '9']],
  ])('on page %i of 9 shows the ends and the neighbours', (page, expected) => {
    setup(page, 9);
    expect(pageNumbers()).toEqual(expected);
  });

  it('goes to a page, the previous page and the next page', async () => {
    const { onPageChange, user } = setup(5, 9);

    await user.click(screen.getByRole('button', { name: 'Page 6' }));
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Page 9' }));

    expect(onPageChange.mock.calls).toEqual([[6], [4], [6], [9]]);
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    rerender(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
