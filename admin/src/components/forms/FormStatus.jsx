import { InlineError } from '../ui/InlineError.jsx';

// The top of a form: why the last save failed, in our words. `subject` picks a code's wording
// for one kind of item (see lib/errors.js).
export function FormStatus({ error, subject }) {
  if (!error) return null;
  return (
    <div className="rounded-plate border border-danger bg-danger-tint px-4 py-3">
      <InlineError error={error} subject={subject} />
    </div>
  );
}
