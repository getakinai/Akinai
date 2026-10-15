import Section from '~/components/section'
import { FormInputNumber } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { type DiscountFormState, type SetDiscountField } from './_form_state'

type FreeShippingSectionProps = {
  state: DiscountFormState
  set: SetDiscountField
  disabled: boolean
  errors: FieldErrors
}

/** Optional cap on which shipping rates a free shipping discount covers. */
export default function FreeShippingSection({
  state,
  set,
  disabled,
  errors,
}: FreeShippingSectionProps) {
  return (
    <Section title="Shipping rates">
      <FormInputNumber
        name="maxShippingPrice"
        label="Exclude shipping rates over (optional)"
        placeholder="No limit"
        value={state.maxShippingPrice}
        disabled={disabled}
        onChange={(next) => set('maxShippingPrice', next)}
        error={errors.maxShippingPrice}
      />
      <p className="-mt-2 text-[12.5px] text-muted">
        The chosen shipping rate is free when it costs this much or less. Leave it empty to make
        every rate free.
      </p>
    </Section>
  )
}
