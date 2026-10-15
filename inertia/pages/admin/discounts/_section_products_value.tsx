import Section from '~/components/section'
import { FormInputNumber, FormSelectWithSearch } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { type DiscountFormState, type SetDiscountField } from './_form_state'
import TargetField from './_target_field'
import { DiscountValueTypeSchema, type DiscountType } from './_types'

type ValueSectionProps = {
  type: Extract<DiscountType, 'amount_off_order' | 'amount_off_products'>
  state: DiscountFormState
  set: SetDiscountField
  disabled: boolean
  errors: FieldErrors
}

/**
 * Value for amount-off discounts; amount off products also picks the
 * products or collections it applies to.
 */
export default function ValueSection({ type, state, set, disabled, errors }: ValueSectionProps) {
  return (
    <Section title="Discount value">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectWithSearch
          name="valueType"
          label="Type"
          value={state.valueType}
          disabled={disabled}
          onChange={(next) => set('valueType', DiscountValueTypeSchema.parse(next))}
          options={[
            { value: 'percentage', label: 'Percentage' },
            { value: 'fixed_amount', label: 'Fixed amount' },
          ]}
          error={errors.valueType}
        />
        <FormInputNumber
          name="value"
          label={state.valueType === 'percentage' ? 'Percentage off' : 'Amount off'}
          placeholder={state.valueType === 'percentage' ? '10' : '100.00'}
          value={state.value}
          disabled={disabled}
          onChange={(next) => set('value', next)}
          error={errors.value}
        />
      </div>
      {type === 'amount_off_products' && (
        <>
          <TargetField
            name="applies"
            label="Applies to"
            appliesTo={state.appliesTo}
            onAppliesToChange={(next) => set('appliesTo', next)}
            products={state.products}
            onProductsChange={(items) => set('products', items)}
            collections={state.collections}
            onCollectionsChange={(items) => set('collections', items)}
            disabled={disabled}
            error={errors.productIds ?? errors.collectionIds ?? errors.appliesTo}
          />
          {state.valueType === 'fixed_amount' && (
            <p className="-mt-2 text-[12.5px] text-muted">
              A fixed amount is taken once per order, split across the matching items.
            </p>
          )}
        </>
      )}
    </Section>
  )
}
