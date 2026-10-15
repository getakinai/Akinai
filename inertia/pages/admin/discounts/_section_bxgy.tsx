import Section from '~/components/section'
import { FormInputNumber, FormSelectWithSearch } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { type DiscountFormState, type SetDiscountField } from './_form_state'
import TargetField from './_target_field'
import { DiscountBuyRequirementSchema, DiscountGetValueSchema } from './_types'

type BxgySectionProps = {
  state: DiscountFormState
  set: SetDiscountField
  disabled: boolean
  errors: FieldErrors
}

/** "Customer buys" and "Customer gets" for Buy X get Y discounts. */
export default function BxgySection({ state, set, disabled, errors }: BxgySectionProps) {
  const getValue =
    state.valueType === 'percentage' && state.value === 100 ? 'free' : state.valueType

  return (
    <>
      <Section title="Customer buys">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectWithSearch
            name="buyRequirement"
            label="Requirement"
            value={state.buyRequirement}
            disabled={disabled}
            onChange={(next) => set('buyRequirement', DiscountBuyRequirementSchema.parse(next))}
            options={[
              { value: 'quantity', label: 'Minimum quantity of items' },
              { value: 'amount', label: 'Minimum purchase amount' },
            ]}
            error={errors.buyRequirement}
          />
          <FormInputNumber
            name="buyValue"
            label={state.buyRequirement === 'quantity' ? 'Quantity' : 'Amount'}
            placeholder={state.buyRequirement === 'quantity' ? '2' : '50.00'}
            value={state.buyValue}
            disabled={disabled}
            onChange={(next) => set('buyValue', next)}
            error={errors.buyValue}
          />
        </div>
        <TargetField
          name="buy"
          label="Any items from"
          appliesTo={state.buyAppliesTo}
          onAppliesToChange={(next) => set('buyAppliesTo', next)}
          products={state.buyProducts}
          onProductsChange={(items) => set('buyProducts', items)}
          collections={state.buyCollections}
          onCollectionsChange={(items) => set('buyCollections', items)}
          disabled={disabled}
          error={errors.buyProductIds ?? errors.buyCollectionIds ?? errors.buyAppliesTo}
        />
      </Section>

      <Section title="Customer gets">
        <FormInputNumber
          name="getQuantity"
          label="Quantity"
          placeholder="1"
          value={state.getQuantity}
          disabled={disabled}
          onChange={(next) => set('getQuantity', next)}
          error={errors.getQuantity}
        />
        <TargetField
          name="get"
          label="Any items from"
          appliesTo={state.appliesTo}
          onAppliesToChange={(next) => set('appliesTo', next)}
          products={state.products}
          onProductsChange={(items) => set('products', items)}
          collections={state.collections}
          onCollectionsChange={(items) => set('collections', items)}
          disabled={disabled}
          error={errors.productIds ?? errors.collectionIds ?? errors.appliesTo}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectWithSearch
            name="getValue"
            label="At a discounted value"
            value={getValue}
            disabled={disabled}
            onChange={(next) => {
              const choice = DiscountGetValueSchema.parse(next)
              if (choice === 'free') {
                set('valueType', 'percentage')
                set('value', 100)
              } else {
                set('valueType', choice)
                if (getValue === 'free') set('value', null)
              }
            }}
            options={[
              { value: 'free', label: 'Free' },
              { value: 'percentage', label: 'Percentage off' },
              { value: 'fixed_amount', label: 'Amount off each' },
            ]}
            error={errors.valueType}
          />
          {getValue !== 'free' && (
            <FormInputNumber
              name="value"
              label={state.valueType === 'percentage' ? 'Percentage off' : 'Amount off each'}
              placeholder={state.valueType === 'percentage' ? '50' : '10.00'}
              value={state.value}
              disabled={disabled}
              onChange={(next) => set('value', next)}
              error={errors.value}
            />
          )}
        </div>
        <FormInputNumber
          name="maxUsesPerOrder"
          label="Maximum uses per order (optional)"
          placeholder="Unlimited"
          value={state.maxUsesPerOrder}
          disabled={disabled}
          onChange={(next) => set('maxUsesPerOrder', next)}
          error={errors.maxUsesPerOrder}
        />
      </Section>
    </>
  )
}
