import { useId } from 'react';
import { cn } from '../../lib/cn.js';
import { Card } from '../ui/Card.jsx';

// A chart on a plate, under its title. The drawing is decoration for assistive technology:
// the same figures are given as a table (`columns` are its headers, `rows` arrays of cells)
// that only screen readers meet. With `empty` there is nothing to draw, and it says so.
export function ChartCard({
  title,
  description,
  columns,
  rows,
  empty = false,
  className,
  children,
}) {
  const titleId = useId();

  return (
    <Card as="section" aria-labelledby={titleId} className={cn('flex flex-col gap-4', className)}>
      <header>
        <h2 id={titleId} className="text-body font-extrabold">
          {title}
        </h2>
        {description && <p className="text-xs font-medium text-text-muted">{description}</p>}
      </header>
      {empty ? (
        <p className="py-6 text-sm text-text-muted">Nothing in this range yet.</p>
      ) : (
        <div aria-hidden="true" className="h-64 text-xs font-medium">
          {children}
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([heading, ...cells]) => (
            <tr key={heading}>
              <th scope="row">{heading}</th>
              {cells.map((cell, index) => (
                <td key={columns[index + 1]}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
