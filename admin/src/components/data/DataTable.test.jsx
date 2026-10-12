import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil, Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render.jsx';
import { DataTable } from './DataTable.jsx';

const COLUMNS = [
  { key: 'title', header: 'Tour' },
  { key: 'state', header: 'State', className: 'text-text-muted' },
  { key: 'price', header: 'From', align: 'right', render: (row) => `₹${row.price}` },
];

const ROWS = [
  { id: 't1', title: 'Goa Coastal Escape', state: 'Goa', price: 14999 },
  { id: 't2', title: 'Ladakh High Passes', state: 'Ladakh', price: 42999 },
];

const cellsOf = (row) => within(row).getAllByRole('cell');
const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('DataTable', () => {
  it('renders a named table with a header per column and a row per item', () => {
    renderApp(<DataTable caption="Tours" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('table', { name: 'Tours' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tours' })).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Tour',
      'State',
      'From',
    ]);
    expect(bodyRows()).toHaveLength(2);
  });

  it('shows the field named by the key, or what `render` returns', () => {
    renderApp(<DataTable caption="Tours" columns={COLUMNS} rows={ROWS} />);
    const [title, state, price] = cellsOf(bodyRows()[0]);

    expect(title).toHaveTextContent('Goa Coastal Escape');
    expect(state).toHaveTextContent('Goa');
    expect(state).toHaveClass('text-text-muted');
    expect(price).toHaveTextContent('₹14999');
  });

  it('right-aligns a numeric column, header and cells, with tabular figures', () => {
    renderApp(<DataTable caption="Tours" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('columnheader', { name: 'From' })).toHaveClass('text-right');
    expect(cellsOf(bodyRows()[0])[2]).toHaveClass('text-right', 'tabular-nums');
    expect(screen.getByRole('columnheader', { name: 'Tour' })).toHaveClass('text-left');
  });

  it('keys rows with `getRowKey` when they have no id', () => {
    const rows = [
      { slug: 'a', title: 'A', state: 'Goa', price: 1 },
      { slug: 'b', title: 'B', state: 'Goa', price: 2 },
    ];
    renderApp(
      <DataTable caption="Tours" columns={COLUMNS} rows={rows} getRowKey={(row) => row.slug} />,
    );
    expect(bodyRows()).toHaveLength(2);
  });

  it('shows one row with the empty message when there is nothing to list', () => {
    renderApp(
      <DataTable
        caption="Tours"
        columns={COLUMNS}
        rows={[]}
        empty="No tours match these filters."
      />,
    );
    const [row] = bodyRows();

    expect(bodyRows()).toHaveLength(1);
    expect(cellsOf(row)[0]).toHaveTextContent('No tours match these filters.');
    expect(cellsOf(row)[0]).toHaveAttribute('colspan', '3');
  });

  it('has a default empty message', () => {
    renderApp(<DataTable caption="Tours" columns={COLUMNS} />);
    expect(screen.getByRole('cell')).toHaveTextContent('Nothing to show here yet.');
  });

  it('draws placeholder rows while loading, in place of rows and the empty message', () => {
    const { container } = renderApp(
      <DataTable caption="Tours" columns={COLUMNS} rows={ROWS} loading skeletonRows={4} />,
    );

    expect(screen.getByRole('table', { name: 'Tours' })).toHaveAttribute('aria-busy', 'true');
    expect(bodyRows()).toHaveLength(4);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(12);
    expect(screen.queryByText('Goa Coastal Escape')).not.toBeInTheDocument();
    expect(screen.queryByText('Nothing to show here yet.')).not.toBeInTheDocument();
  });

  describe('row actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const rowActions = (row) => [
      { key: 'edit', label: `Edit ${row.title}`, icon: Pencil, to: `/tours/${row.id}` },
      {
        key: 'delete',
        label: `Delete ${row.title}`,
        icon: Trash2,
        variant: 'danger',
        onSelect: () => onDelete(row.id),
      },
      { key: 'rename', label: `Rename ${row.title}`, icon: Pencil, onSelect: () => onEdit(row) },
    ];

    it('adds an Actions column with a named control per action and row', () => {
      renderApp(
        <DataTable caption="Tours" columns={COLUMNS} rows={ROWS} rowActions={rowActions} />,
      );

      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Edit Goa Coastal Escape' })).toHaveAttribute(
        'href',
        '/tours/t1',
      );
      expect(screen.getByRole('button', { name: 'Delete Ladakh High Passes' })).toHaveClass(
        'text-danger',
      );
    });

    it('calls the action of the row that was pressed', async () => {
      const user = userEvent.setup();
      renderApp(
        <DataTable caption="Tours" columns={COLUMNS} rows={ROWS} rowActions={rowActions} />,
      );

      await user.click(screen.getByRole('button', { name: 'Delete Ladakh High Passes' }));
      await user.click(screen.getByRole('button', { name: 'Rename Goa Coastal Escape' }));

      expect(onDelete).toHaveBeenCalledExactlyOnceWith('t2');
      expect(onEdit).toHaveBeenCalledExactlyOnceWith(ROWS[0]);
    });

    it('spans the empty message and the placeholders across the actions column too', () => {
      const { rerender } = renderApp(
        <DataTable caption="Tours" columns={COLUMNS} rows={[]} rowActions={rowActions} />,
      );
      expect(screen.getByRole('cell')).toHaveAttribute('colspan', '4');

      rerender(null);
      renderApp(
        <DataTable
          caption="Tours"
          columns={COLUMNS}
          loading
          skeletonRows={1}
          rowActions={rowActions}
        />,
      );
      expect(screen.getAllByRole('cell')).toHaveLength(4);
    });
  });

  describe('server pagination', () => {
    const meta = { page: 2, limit: 2, total: 5, totalPages: 3 };

    it('says which rows of the total are showing', () => {
      renderApp(
        <DataTable
          caption="Tours"
          columns={COLUMNS}
          rows={ROWS}
          pagination={{ ...meta, onPageChange: vi.fn() }}
        />,
      );

      expect(screen.getByText('Showing 3–4 of 5')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('asks for the page that was chosen', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      renderApp(
        <DataTable
          caption="Tours"
          columns={COLUMNS}
          rows={ROWS}
          pagination={{ ...meta, onPageChange }}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(screen.getByRole('button', { name: 'Page 1' }));

      expect(onPageChange.mock.calls).toEqual([[3], [1]]);
    });

    it('counts a short last page correctly and hides the pager when there is one page', () => {
      renderApp(
        <DataTable
          caption="Tours"
          columns={COLUMNS}
          rows={ROWS.slice(0, 1)}
          pagination={{ page: 1, limit: 12, total: 1, totalPages: 1, onPageChange: vi.fn() }}
        />,
      );

      expect(screen.getByText('Showing 1–1 of 1')).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    });

    it('shows no count while loading or when the list is empty', () => {
      const pagination = { page: 1, limit: 12, total: 0, totalPages: 0, onPageChange: vi.fn() };
      const { rerender } = renderApp(
        <DataTable caption="Tours" columns={COLUMNS} rows={[]} pagination={pagination} />,
      );
      expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument();

      rerender(null);
      renderApp(
        <DataTable
          caption="Tours"
          columns={COLUMNS}
          loading
          pagination={{ ...meta, onPageChange: vi.fn() }}
        />,
      );
      expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument();
    });
  });
});
