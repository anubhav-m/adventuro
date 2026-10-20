import { QueryBoundary } from '../QueryBoundary.jsx';
import { PageHeader } from './PageHeader.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { SkeletonText } from '../ui/SkeletonText.jsx';

const DocumentSkeleton = (
  <div className="flex max-w-4xl flex-col gap-5">
    <Skeleton className="h-10 w-full" />
    <SkeletonText lines={6} />
  </div>
);

// A page about one document (an editor, a booking): the page keeps its title while the
// document loads or fails, and `children(document)` draws the page once it is here.
export function DocumentLoader({ query, title, children }) {
  if (query.isSuccess) return children(query.data);
  return (
    <>
      <PageHeader title={title} />
      <QueryBoundary query={query} skeleton={DocumentSkeleton}>
        {() => null}
      </QueryBoundary>
    </>
  );
}
