import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  useDeleteTaxonomy,
  useUpdateTaxonomy,
} from '../../hooks/mutations/useTaxonomyMutations.js';
import { useTaxonomies } from '../../hooks/queries/useTaxonomies.js';
import { LIMITS } from '../../lib/constants.js';
import { ERROR_SUBJECT, getErrorMessage } from '../../lib/errors.js';
import { taxonomyNameSchema } from '../../lib/schemas.js';
import { DataTable } from '../data/DataTable.jsx';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { TaxonomyAddForm } from './TaxonomyAddForm.jsx';

const NAME_COLUMN = { key: 'name', header: 'Name', className: 'min-w-64 font-bold' };
const SLUG_COLUMN = { key: 'slug', header: 'Slug', className: 'text-text-muted' };

// One taxonomy list (`type` is { value, label, plural }): add, rename in place, delete. Enter
// saves a rename and Escape drops it. An item that gear still uses cannot be deleted.
export function TaxonomyPanel({ type }) {
  const taxonomies = useTaxonomies(type.value);
  const updateTaxonomy = useUpdateTaxonomy();
  const deleteTaxonomy = useDeleteTaxonomy();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const saveRename = () => {
    const parsed = taxonomyNameSchema.safeParse(editing.name);
    if (!parsed.success) {
      setEditing({ ...editing, error: parsed.error.issues[0].message });
      return;
    }
    updateTaxonomy.mutate(
      { id: editing.id, changes: { name: parsed.data } },
      {
        onSuccess: (taxonomy) => {
          toast.success(`Renamed to ${taxonomy.name}.`);
          setEditing(null);
        },
        onError: (error) =>
          setEditing((current) => current && { ...current, error: getErrorMessage(error) }),
      },
    );
  };

  const closeDelete = () => {
    deleteTaxonomy.reset();
    setDeleting(null);
  };

  const nameCell = (taxonomy) => {
    if (editing?.id !== taxonomy.id) return taxonomy.name;
    return (
      <Field label={`New name for ${taxonomy.name}`} hideLabel error={editing.error}>
        {(control) => (
          <Input
            {...control}
            autoFocus
            value={editing.name}
            maxLength={LIMITS.NAME_MAX}
            onChange={(event) => setEditing({ ...editing, name: event.target.value, error: null })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveRename();
              if (event.key === 'Escape') setEditing(null);
            }}
          />
        )}
      </Field>
    );
  };

  const rowActions = (taxonomy) =>
    editing?.id === taxonomy.id
      ? [
          {
            key: 'save',
            label: `Save the new name for ${taxonomy.name}`,
            icon: Check,
            onSelect: saveRename,
          },
          {
            key: 'cancel',
            label: `Cancel renaming ${taxonomy.name}`,
            icon: X,
            onSelect: () => setEditing(null),
          },
        ]
      : [
          {
            key: 'rename',
            label: `Rename ${taxonomy.name}`,
            icon: Pencil,
            onSelect: () => setEditing({ id: taxonomy.id, name: taxonomy.name, error: null }),
          },
          {
            key: 'delete',
            label: `Delete ${taxonomy.name}`,
            icon: Trash2,
            variant: 'danger',
            onSelect: () => setDeleting(taxonomy),
          },
        ];

  const columns = [{ ...NAME_COLUMN, render: nameCell }, SLUG_COLUMN];

  return (
    <div className="flex flex-col gap-5">
      <TaxonomyAddForm type={type} />
      <QueryBoundary
        query={taxonomies}
        skeleton={<DataTable caption={type.plural} columns={columns} loading />}
        isEmpty={() => false}
      >
        {(rows) => (
          <DataTable
            caption={type.plural}
            columns={columns}
            rows={rows}
            rowActions={rowActions}
            empty={`No ${type.plural.toLowerCase()} yet.`}
          />
        )}
      </QueryBoundary>
      {deleting && (
        <ConfirmDialog
          open
          title={`Delete ${deleting.name}?`}
          confirmLabel="Delete"
          loading={deleteTaxonomy.isPending}
          error={deleteTaxonomy.error}
          errorSubject={ERROR_SUBJECT.TAXONOMY}
          onConfirm={() =>
            deleteTaxonomy.mutate(deleting.id, {
              onSuccess: () => {
                toast.success(`${deleting.name} deleted.`);
                closeDelete();
              },
            })
          }
          onCancel={closeDelete}
        >
          <p>{`It is removed from the ${type.plural.toLowerCase()} list for good.`}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
