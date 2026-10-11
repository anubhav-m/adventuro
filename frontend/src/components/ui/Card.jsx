import { cn } from '../../lib/cn.js';

export function Card({ as: Tag = 'div', interactive = false, className, children, ...rest }) {
  return (
    <Tag
      className={cn(
        'rounded-plate border border-border bg-surface p-5',
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
