import { useState } from 'react';
import { moveItem, removeAt } from '../lib/list.js';

let lastKey = 0;
const newKey = () => {
  lastKey += 1;
  return `item-${lastKey}`;
};
const freshKeys = (length) => Array.from({ length }, newKey);

// Stable React keys for the rows of a list editor whose items have no ids of their own, so a
// row keeps its focus and its DOM when rows are added, removed or moved. Call the operation
// beside the change it mirrors. A list replaced from outside (a form reset) gets new keys.
export const useListKeys = (length) => {
  const [keys, setKeys] = useState(() => freshKeys(length));
  const current = keys.length === length ? keys : freshKeys(length);
  if (current !== keys) setKeys(current);

  return {
    keys: current,
    add: () => setKeys([...current, newKey()]),
    remove: (index) => setKeys(removeAt(current, index)),
    move: (from, to) => setKeys(moveItem(current, from, to)),
  };
};
