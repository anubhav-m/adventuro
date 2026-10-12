import { cn } from '../../lib/cn.js';

// `action` is a ready element, usually a <Button>.
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex max-w-prose flex-col items-start gap-3 py-8', className)}>
      {Icon && <Icon size={32} strokeWidth={1.75} aria-hidden="true" className="text-text-muted" />}
      <h3 className="text-h4 font-extrabold">{title}</h3>
      {description && <p className="text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
