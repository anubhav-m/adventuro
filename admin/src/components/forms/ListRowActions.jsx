import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { IconButton } from '../ui/IconButton.jsx';

// Move up, move down and remove, for one row of a list editor. `itemName` names the row in
// each button's label ("Move Day 2 up"), so every button says which row it acts on.
export function ListRowActions({ index, count, itemName, onMove, onRemove, removeDisabled }) {
  return (
    <div className="flex shrink-0 gap-0.5">
      <IconButton
        icon={ArrowUp}
        label={`Move ${itemName} up`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      />
      <IconButton
        icon={ArrowDown}
        label={`Move ${itemName} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      />
      <IconButton
        icon={Trash2}
        variant="danger"
        label={`Remove ${itemName}`}
        disabled={removeDisabled}
        onClick={() => onRemove(index)}
      />
    </div>
  );
}
