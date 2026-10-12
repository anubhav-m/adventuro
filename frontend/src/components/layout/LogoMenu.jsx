import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '../../lib/cn.js';
import { NAV_LINKS, ROUTES, VERTICALS } from '../../lib/constants.js';
import { getMenuItems, handleMenuKeyDown } from '../../lib/menu.js';
import { Wordmark } from './Wordmark.jsx';

const HOVER_CLOSE_DELAY_MS = 150;

const ROW = 'group flex min-h-11 items-center gap-3 rounded-field px-3 text-sm font-semibold';
const VERTICAL_ROW = cn(
  ROW,
  'hover:bg-accent hover:text-on-accent focus-visible:bg-accent focus-visible:text-on-accent',
);
const PLAIN_ROW = cn(ROW, 'hover:bg-surface focus-visible:bg-surface');
// A 12px square of the vertical's ink. On the light sheet it keeps a dark edge (Light Field Rule).
const INK_SQUARE =
  'size-3 shrink-0 border-(length:--border-ink) border-text bg-accent group-hover:border-on-accent group-hover:bg-on-accent group-focus-visible:border-on-accent group-focus-visible:bg-on-accent dark:border-accent';

const isMouse = (event) => event.pointerType === 'mouse';

// The wordmark links home. Beside it, a menu of the six verticals that opens on hover, keyboard
// focus, click and tap, and closes on Escape, outside press and route change.
export function LogoMenu() {
  const location = useLocation();
  // The menu is open only for the location it was opened on, so any navigation closes it.
  const [openedAt, setOpenedAt] = useState(null);
  const open = openedAt === location.key;

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimer = useRef(null);
  const focusFirstOnOpen = useRef(false);
  const ignoreNextFocus = useRef(false);
  const pressedWithMouse = useRef(false);
  const menuId = useId();

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpenedAt(location.key);
  };
  const hide = () => {
    clearTimeout(closeTimer.current);
    setOpenedAt(null);
  };
  const focusFirstItem = () => getMenuItems(menuRef.current)[0]?.focus();

  useEffect(() => {
    if (!open) return undefined;
    if (focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      getMenuItems(menuRef.current)[0]?.focus();
    }
    const closeOnOutsidePress = (event) => {
      if (!rootRef.current.contains(event.target)) setOpenedAt(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const openAndFocusFirstItem = () => {
    if (open) {
      focusFirstItem();
    } else {
      focusFirstOnOpen.current = true;
      show();
    }
  };

  // A mouse has already opened the menu by hovering, so its click must not close it again.
  // A tap has no hover, so it toggles.
  const handleButtonClick = (event) => {
    const fromKeyboard = event.detail === 0;
    if (fromKeyboard) openAndFocusFirstItem();
    else if (open && !pressedWithMouse.current) hide();
    else show();
  };

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openAndFocusFirstItem();
    } else if (event.key === 'Escape' && open) {
      hide();
    }
  };

  const handleButtonFocus = (event) => {
    if (ignoreNextFocus.current) {
      ignoreNextFocus.current = false;
      return;
    }
    if (event.target.matches(':focus-visible')) show();
  };

  const handleMenuKeys = (event) => {
    if (event.key === 'Escape') {
      hide();
      ignoreNextFocus.current = true;
      buttonRef.current.focus();
    } else {
      handleMenuKeyDown(event, menuRef.current);
    }
  };

  const handleBlur = (event) => {
    if (!rootRef.current.contains(event.relatedTarget)) hide();
  };

  const itemProps = { role: 'menuitem', tabIndex: -1, onClick: hide };

  return (
    <div
      ref={rootRef}
      className="relative flex items-center"
      onPointerEnter={(event) => isMouse(event) && show()}
      onPointerLeave={(event) => {
        if (isMouse(event)) closeTimer.current = setTimeout(hide, HOVER_CLOSE_DELAY_MS);
      }}
      onBlur={handleBlur}
    >
      <Link to={ROUTES.HOME} aria-label="Adventuro home" className="flex min-h-11 items-center">
        <Wordmark size="nav" />
      </Link>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Browse verticals"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onPointerDown={(event) => {
          pressedWithMouse.current = isMouse(event);
        }}
        onClick={handleButtonClick}
        onKeyDown={handleButtonKeyDown}
        onFocus={handleButtonFocus}
        className="flex h-11 w-8 items-center justify-center rounded-pill hover:bg-surface-raised sm:w-9"
      >
        <ChevronDown
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className={cn(
            'transition-transform duration-(--duration-base) ease-out',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Verticals"
          onKeyDown={handleMenuKeys}
          className="absolute top-full left-0 z-40 w-72 animate-menu-in rounded-panel border border-border bg-surface-raised p-2 shadow-raised"
        >
          {VERTICALS.map(({ key, name, icon: Icon, route }) => (
            <li key={key} role="none">
              <Link to={route} data-vertical={key} className={VERTICAL_ROW} {...itemProps}>
                <span aria-hidden="true" className={INK_SQUARE} />
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                {name}
              </Link>
            </li>
          ))}
          {/* The navbar has no room for its links below 768px, so they live here. */}
          {NAV_LINKS.map(({ label, to, icon: Icon }, index) => (
            <li
              key={to}
              role="none"
              className={cn('md:hidden', index === 0 && 'mt-2 border-t border-border pt-2')}
            >
              <Link to={to} className={PLAIN_ROW} {...itemProps}>
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
