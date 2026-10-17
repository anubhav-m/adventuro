import { useFormContext, useWatch } from 'react-hook-form';
import { LIMITS } from '../../lib/constants.js';
import { formatNumber } from '../../lib/format.js';
import { Field } from '../ui/Field.jsx';
import { MoneyInput } from '../ui/MoneyInput.jsx';

const discountOf = (mrp, salePrice) =>
  Number.isInteger(mrp) && Number.isInteger(salePrice) && salePrice < mrp
    ? Math.round(((mrp - salePrice) / mrp) * 100)
    : 0;

// The MRP and sale price of a gear item, inside a react-hook-form form with the fields `mrp`
// and `salePrice`. The sale price may not be above the MRP; a change to the MRP checks it again.
export function PriceInputs() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const [mrp, salePrice] = useWatch({ control, name: ['mrp', 'salePrice'] });
  const discount = discountOf(mrp, salePrice);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="MRP" error={errors.mrp?.message}>
        {(controlProps) => (
          <MoneyInput
            {...controlProps}
            max={LIMITS.PRICE_MAX}
            {...register('mrp', { valueAsNumber: true, deps: ['salePrice'] })}
          />
        )}
      </Field>
      <Field
        label="Sale price"
        error={errors.salePrice?.message}
        hint={discount > 0 ? `${formatNumber(discount)}% below the MRP.` : 'At or below the MRP.'}
      >
        {(controlProps) => (
          <MoneyInput
            {...controlProps}
            max={LIMITS.PRICE_MAX}
            {...register('salePrice', { valueAsNumber: true })}
          />
        )}
      </Field>
    </div>
  );
}
