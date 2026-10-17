import { PageHeader } from '../layout/PageHeader.jsx';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { SkeletonText } from '../ui/SkeletonText.jsx';

const EditorSkeleton = (
  <div className="flex max-w-4xl flex-col gap-5">
    <Skeleton className="h-10 w-full" />
    <SkeletonText lines={6} />
  </div>
);

// An editor page waiting for the document it edits: the page keeps its title while the
// document loads or fails, and `children(document)` draws the editor once it is here.
export function EditorLoader({ query, title, children }) {
  if (query.isSuccess) return children(query.data);
  return (
    <>
      <PageHeader title={title} />
      <QueryBoundary query={query} skeleton={EditorSkeleton}>
        {() => null}
      </QueryBoundary>
    </>
  );
}
