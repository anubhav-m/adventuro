import { cn } from '../../lib/cn.js';

// `flush` drops the padding, for a card whose photo runs to its edges.
export function Card({
  as: Tag = 'div',
  interactive = false,
  flush = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        'rounded-plate border border-border bg-surface',
        !flush && 'p-5',
        interactive &&
          'transition-colors duration-(--duration-fast) ease-out hover:border-accent focus-within:border-accent',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
