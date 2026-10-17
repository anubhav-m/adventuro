import { useCallback, useEffect, useRef } from 'react';
import { useDeleteUpload } from './mutations/useUploadMutations.js';

// The images uploaded on this page that no saved tour, gear item or vertical holds yet.
// - `track(image)` after an upload; `release(image)` when an image leaves the form, which
//   deletes it from storage if it was never saved (a saved one is cleaned up by the server).
// - `commit()` after a save: everything tracked is now held by the saved document.
// Leaving the page without saving deletes whatever is still pending.
export const useUploadSession = () => {
  const { mutate: deleteUpload } = useDeleteUpload();
  const pending = useRef(new Set());

  const track = useCallback((image) => {
    if (image.path) pending.current.add(image.path);
  }, []);

  const release = useCallback(
    (image) => {
      if (image?.path && pending.current.delete(image.path)) deleteUpload(image.path);
    },
    [deleteUpload],
  );

  const commit = useCallback(() => pending.current.clear(), []);

  useEffect(() => {
    const paths = pending.current;
    return () => {
      for (const path of paths) deleteUpload(path);
      paths.clear();
    };
  }, [deleteUpload]);

  return { track, release, commit };
};
