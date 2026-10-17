import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useUploadImage } from '../../hooks/mutations/useUploadMutations.js';
import { cn } from '../../lib/cn.js';
import { IMAGE_UPLOAD } from '../../lib/constants.js';
import { clientError } from '../../lib/errors.js';
import { Button } from '../ui/Button.jsx';
import { FieldError } from '../ui/Field.jsx';
import { InlineError } from '../ui/InlineError.jsx';
import { Spinner } from '../ui/Spinner.jsx';

// The file is checked here before anything is sent; the server checks it again.
const checkFile = (file) => {
  if (!IMAGE_UPLOAD.TYPES.includes(file.type)) return clientError('INVALID_FILE');
  if (file.size > IMAGE_UPLOAD.MAX_BYTES) return clientError('FILE_TOO_LARGE');
  return null;
};

// One image field: `value` is { url, path } or null, and `onChange` receives the next one.
// A chosen file is checked, uploaded to `folder` and previewed. `session` (useUploadSession)
// knows which uploads are not saved yet, so removing or replacing one deletes it from storage.
// With `value` always null it is an "add" slot, as the gallery uses it. `error` is the form's
// message for the field, and `uploadLabel` names the button that picks a file.
export function ImageUploader({
  label,
  value,
  onChange,
  folder,
  session,
  error,
  uploadLabel = 'Upload image',
  className,
}) {
  const inputRef = useRef(null);
  const labelId = useId();
  const upload = useUploadImage();
  const [problem, setProblem] = useState(null);

  const handleFile = async (file) => {
    setProblem(null);
    const rejection = checkFile(file);
    if (rejection) {
      setProblem(rejection);
      return;
    }
    try {
      const image = await upload.mutateAsync({ file, folder });
      session.track(image);
      session.release(value);
      onChange(image);
    } catch (uploadError) {
      setProblem(uploadError);
    }
  };

  const handleChange = (event) => {
    const [file] = event.target.files;
    // Cleared, so choosing the same file again still counts as a change.
    event.target.value = '';
    if (file) handleFile(file);
  };

  const choose = () => inputRef.current.click();

  return (
    <div role="group" aria-labelledby={labelId} className={cn('flex flex-col gap-2', className)}>
      <span id={labelId} className="text-sm font-bold">
        {label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD.TYPES.join(',')}
        aria-label={`${label}: choose a file`}
        tabIndex={-1}
        className="sr-only"
        onChange={handleChange}
      />
      {value ? (
        <div className="flex flex-wrap items-end gap-3">
          <img
            src={value.url}
            alt={`${label}, current image`}
            className="aspect-[3/2] w-48 rounded-plate border border-border bg-surface-sunken object-cover"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={upload.isPending}
              onClick={choose}
            >
              Replace
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              disabled={upload.isPending}
              onClick={() => {
                session.release(value);
                onChange(null);
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 rounded-plate border border-border-strong bg-surface p-4">
          <ImagePlus size={24} strokeWidth={1.75} aria-hidden="true" className="text-text-muted" />
          <p className="flex-1 text-xs text-text-muted">JPG, PNG or WebP, up to 5 MB.</p>
          {upload.isPending ? (
            <Spinner label="Uploading…" />
          ) : (
            <Button variant="secondary" size="sm" onClick={choose}>
              {uploadLabel}
            </Button>
          )}
        </div>
      )}
      {problem && <InlineError error={problem} />}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
