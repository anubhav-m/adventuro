import { cn } from '../../lib/cn.js';
import { formatNumber } from '../../lib/format.js';
import { IconButton } from '../ui/IconButton.jsx';
import { Pagination } from '../ui/Pagination.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

const CELL = 'h-11 px-3 py-1.5';
const ALIGN = { left: 'text-left', right: 'text-right tabular-nums' };
const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3'];

const alignOf = (column) => ALIGN[column.align ?? 'left'];

// The one table of the admin app.
// - `columns`: [{ key, header, render?: (row) => node, align?: 'right', className? }]. A column
//   without `render` shows `row[key]`. Numbers are `align: 'right'`.
// - `rowActions`: (row) => [{ key, label, icon, onSelect?, to?, variant? }], shown as icon buttons
//   in a last column. `label` is the button's name, so it names the row ("Edit Goa Escape").
// - `pagination`: the list's `meta` ({ page, limit, total, totalPages }) plus `onPageChange`.
// - `loading` draws `skeletonRows` rows of placeholders; no rows draws `empty` in one row.
// `caption` names the table for assistive technology and is not shown.
export function DataTable({
  caption,
  columns,
  rows = [],
  getRowKey = (row) => row.id,
  rowActions,
  pagination,
  loading = false,
  skeletonRows = 5,
  empty = 'Nothing to show here yet.',
  className,
}) {
  const columnCount = columns.length + (rowActions ? 1 : 0);
  const firstRow = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Wide tables scroll sideways inside this frame; it takes focus so keys can scroll it. */}
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className="overflow-x-auto rounded-plate border border-border bg-surface"
      >
        <table aria-busy={loading || undefined} className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface-sunken">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(CELL, 'font-bold whitespace-nowrap', alignOf(column))}
                >
                  {column.header}
                </th>
              ))}
              {rowActions && (
                <th scope="col" className={cn(CELL, ALIGN.right, 'font-bold')}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-border">
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <td key={cellIndex} className={CELL}>
                      <Skeleton
                        className={cn('h-4', SKELETON_WIDTHS[(rowIndex + cellIndex) % 3])}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={columnCount} className={cn(CELL, 'py-6 text-text-muted')}>
                  {empty}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-t border-border transition-colors duration-(--duration-fast) ease-out hover:bg-surface-raised"
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn(CELL, alignOf(column), column.className)}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  {rowActions && (
                    <td className={cn(CELL, 'py-0')}>
                      <div className="flex justify-end gap-1">
                        {rowActions(row).map(({ key, label, onSelect, ...action }) => (
                          <IconButton key={key} label={label} onClick={onSelect} {...action} />
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pagination && !loading && pagination.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted tabular-nums">
            {`Showing ${formatNumber(firstRow)}–${formatNumber(firstRow + rows.length - 1)} of ${formatNumber(pagination.total)}`}
          </p>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}
