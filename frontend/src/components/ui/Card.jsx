import { cn } from '../../lib/cn.js';

// `flush` drops the padding, for a card whose photo runs to its edges. An `interactive` card
// lifts and takes the accent border on hover, and is the `group` its contents can react to.
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
          'group transition-[border-color,translate] duration-(--duration-base) ease-out hover:border-accent focus-within:border-accent motion-safe:hover:-translate-y-1',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
