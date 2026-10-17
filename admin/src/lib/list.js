// Pure helpers for the editors that keep an ordered list (days, packages, images, lines).

// A copy of `items` with the item at `from` moved to `to`.
export const moveItem = (items, from, to) => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export const removeAt = (items, index) => items.filter((_, position) => position !== index);
