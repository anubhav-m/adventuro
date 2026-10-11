import { Spinner } from '../ui/Spinner.jsx';

// Shown while the first route's code is loading.
export function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label="Loading" />
    </div>
  );
}
