const ITEM_SELECTOR = '[role="menuitem"]';

export const getMenuItems = (menu) => [...(menu?.querySelectorAll(ITEM_SELECTOR) ?? [])];

// Arrow, Home and End navigation between the items of a menu. Returns true when it handled the key.
export const handleMenuKeyDown = (event, menu) => {
  const items = getMenuItems(menu);
  if (items.length === 0) return false;
  const current = items.indexOf(document.activeElement);
  const targets = {
    ArrowDown: items[(current + 1) % items.length],
    ArrowUp: items[(current - 1 + items.length) % items.length],
    Home: items[0],
    End: items.at(-1),
  };
  const target = targets[event.key];
  if (!target) return false;
  event.preventDefault();
  target.focus();
  return true;
};
