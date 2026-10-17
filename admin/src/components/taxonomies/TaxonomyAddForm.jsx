import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateTaxonomy } from '../../hooks/mutations/useTaxonomyMutations.js';
import { LIMITS } from '../../lib/constants.js';
import { taxonomyNameSchema } from '../../lib/schemas.js';
import { Button } from '../ui/Button.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { InlineError } from '../ui/InlineError.jsx';

// Adds an item to one taxonomy list. `type` is { value, label }; the slug is made by the server.
export function TaxonomyAddForm({ type }) {
  const createTaxonomy = useCreateTaxonomy();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = taxonomyNameSchema.safeParse(name);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0].message);
      return;
    }
    setNameError(null);
    createTaxonomy.mutate(
      { type: type.value, name: parsed.data },
      {
        onSuccess: (taxonomy) => {
          toast.success(`${taxonomy.name} added.`);
          setName('');
        },
      },
    );
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-2">
        <Field label={`New ${type.label.toLowerCase()}`} error={nameError} className="w-72">
          {(control) => (
            <Input
              {...control}
              value={name}
              maxLength={LIMITS.NAME_MAX}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <Button type="submit" icon={Plus} loading={createTaxonomy.isPending} className="mt-7">
          Add
        </Button>
      </div>
      {createTaxonomy.isError && <InlineError error={createTaxonomy.error} />}
    </form>
  );
}
