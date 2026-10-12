import { cn } from '../../lib/cn.js';

// A plate that holds content: flat, square-cornered, one quiet border.
export function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag className={cn('rounded-plate border border-border bg-surface p-5', className)} {...rest}>
      {children}
    </Tag>
  );
}
