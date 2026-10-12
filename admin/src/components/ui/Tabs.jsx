import { CircleAlert } from 'lucide-react';
import { useId, useRef } from 'react';
import { cn } from '../../lib/cn.js';

const KEY_STEPS = { ArrowRight: 1, ArrowLeft: -1 };

// A row of tabs over their panels. `tabs` is [{ id, label, content, flagged? }]; `value` is the
// id of the open tab. Every panel stays mounted and the closed ones are hidden, so one form can
// run across all of them. A `flagged` tab carries a mark: something in it needs attention.
// Arrow keys, Home and End move between the tabs and open the one they land on.
export function Tabs({ label, tabs, value, onChange, className }) {
  const baseId = useId();
  const listRef = useRef(null);
  const tabId = (id) => `${baseId}-tab-${id}`;
  const panelId = (id) => `${baseId}-panel-${id}`;

  const handleKeyDown = (event) => {
    const current = tabs.findIndex((tab) => tab.id === value);
    const step = KEY_STEPS[event.key];
    const targets = { Home: 0, End: tabs.length - 1 };
    const target = step ? (current + step + tabs.length) % tabs.length : targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    onChange(tabs[target].id);
    listRef.current.querySelectorAll('[role="tab"]')[target].focus();
  };

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tabId(tab.id)}
              aria-selected={selected}
              aria-controls={panelId(tab.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                '-mb-px inline-flex h-10 shrink-0 items-center gap-1.5 border-b-(length:--border-ink) px-3 text-sm font-bold whitespace-nowrap transition-colors duration-(--duration-fast) ease-out',
                selected
                  ? 'border-text text-text'
                  : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {tab.label}
              {tab.flagged && (
                <>
                  <CircleAlert
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="text-danger"
                  />
                  <span className="sr-only"> (needs attention)</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={panelId(tab.id)}
          aria-labelledby={tabId(tab.id)}
          hidden={tab.id !== value}
          tabIndex={0}
          className="pt-5"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
