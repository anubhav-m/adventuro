import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { IconButton } from '../ui/IconButton.jsx';
import { Modal } from '../ui/Modal.jsx';
import { SearchPanel } from './SearchPanel.jsx';

const SHORTCUT = '/';
const TYPING_TARGETS = 'input, textarea, select, [contenteditable="true"]';

// The navbar's search: an icon button and the "/" key open a panel of grouped results.
export function SearchOverlay() {
  const location = useLocation();
  // Open only for the location it was opened on, so choosing a result closes it.
  const [openedAt, setOpenedAt] = useState(null);
  const open = openedAt === location.key;
  const inputRef = useRef(null);

  useEffect(() => {
    const openOnShortcut = (event) => {
      if (event.key !== SHORTCUT || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest?.(TYPING_TARGETS)) return;
      event.preventDefault();
      setOpenedAt(location.key);
    };
    document.addEventListener('keydown', openOnShortcut);
    return () => document.removeEventListener('keydown', openOnShortcut);
  }, [location.key]);

  return (
    <>
      <IconButton
        icon={Search}
        label="Search"
        aria-haspopup="dialog"
        aria-keyshortcuts={SHORTCUT}
        onClick={() => setOpenedAt(location.key)}
      />
      <Modal
        open={open}
        onClose={() => setOpenedAt(null)}
        title="Search"
        placement="top"
        initialFocusRef={inputRef}
      >
        <SearchPanel inputRef={inputRef} />
      </Modal>
    </>
  );
}
