import { Check } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { getMenuItems, handleMenuKeyDown } from '../../lib/menu.js';

const ITEM =
  'flex min-h-11 w-full items-center gap-3 rounded-field px-3 text-left text-sm font-semibold text-text hover:bg-surface focus-visible:bg-surface';

const OPEN_KEYS = ['ArrowDown', 'ArrowUp'];

// A menu button. `trigger` is a render prop that receives the props of the button:
// <Dropdown label="Theme" items={items} trigger={(props) => <IconButton {...props} />} />
// Items are { key, label, icon?, onSelect?, to?, selected? }. Giving any item a `selected`
// boolean makes the menu a single-choice list (radio items).
export function Dropdown({ label, items, trigger, align = 'end' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const isChoice = items.some((item) => item.selected !== undefined);

  useEffect(() => {
    if (!open) return undefined;
    const menuItems = getMenuItems(menuRef.current);
    (
      menuItems.find((item) => item.getAttribute('aria-checked') === 'true') ?? menuItems[0]
    )?.focus();

    const closeOnOutsidePress = (event) => {
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (!OPEN_KEYS.includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
  };

  const handleMenuKeys = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeAndRestoreFocus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else {
      handleMenuKeyDown(event, menuRef.current);
    }
  };

  const selectItem = (item) => {
    item.onSelect?.();
    closeAndRestoreFocus();
  };

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: () => setOpen((wasOpen) => !wasOpen),
        onKeyDown: handleTriggerKeyDown,
      })}
      {open && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeys}
          className={cn(
            'absolute top-full z-40 mt-2 min-w-48 animate-fade-in rounded-panel border border-border bg-surface-raised p-2 shadow-raised',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const itemProps = {
              role: isChoice ? 'menuitemradio' : 'menuitem',
              'aria-checked': isChoice ? Boolean(item.selected) : undefined,
              tabIndex: -1,
              className: ITEM,
              onClick: () => selectItem(item),
            };
            const content = (
              <>
                {Icon && <Icon size={18} strokeWidth={1.75} aria-hidden="true" />}
                <span className="flex-1">{item.label}</span>
                {item.selected && <Check size={18} strokeWidth={1.75} aria-hidden="true" />}
              </>
            );
            return (
              <li key={item.key} role="none">
                {item.to ? (
                  <Link to={item.to} {...itemProps}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" {...itemProps}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
