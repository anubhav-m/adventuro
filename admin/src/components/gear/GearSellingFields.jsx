import { ExternalLink } from 'lucide-react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { LIMITS } from '../../lib/constants.js';
import { isTestableUrl } from '../../lib/schemas.js';
import { FormSection } from '../forms/FormSection.jsx';
import { PriceInputs } from '../forms/PriceInputs.jsx';
import { Button } from '../ui/Button.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Switch } from '../ui/Switch.jsx';

// How the item sells: its prices, the affiliate link every "Buy" leads to, and whether the
// store shows it. "Test link" opens the link as typed, once it is a full https address.
export function GearSellingFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const affiliateUrl = useWatch({ control, name: 'affiliateUrl' });
  const testable = isTestableUrl(affiliateUrl);

  return (
    <FormSection title="Price and link">
      <PriceInputs />
      <div className="flex flex-wrap items-start gap-2">
        <Field
          label="Affiliate link"
          error={errors.affiliateUrl?.message}
          hint="Starts with https://. Every Buy button leads here."
          className="min-w-0 flex-1"
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={LIMITS.URL_MAX}
              {...register('affiliateUrl')}
            />
          )}
        </Field>
        <Button
          variant="secondary"
          iconRight={ExternalLink}
          className="mt-7"
          {...(testable
            ? { href: affiliateUrl.trim(), target: '_blank', rel: 'noopener noreferrer' }
            : { disabled: true })}
        >
          Test link
        </Button>
      </div>
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1">
            <Switch label="Active" checked={field.value} onChange={field.onChange} />
            <p className="text-xs text-text-muted">
              Inactive gear is hidden from the store once this is saved.
            </p>
          </div>
        )}
      />
    </FormSection>
  );
}
