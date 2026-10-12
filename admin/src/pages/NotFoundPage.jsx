import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ROUTES } from '../lib/constants.js';
import { ERROR_MESSAGES } from '../lib/errors.js';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" description={ERROR_MESSAGES.ROUTE_NOT_FOUND} />
      <p className="max-w-prose text-sm text-text-muted">
        The page may have moved, or the link may be mistyped.
      </p>
      <Button to={ROUTES.DASHBOARD} icon={ArrowLeft} className="self-start">
        Back to the dashboard
      </Button>
    </>
  );
}
