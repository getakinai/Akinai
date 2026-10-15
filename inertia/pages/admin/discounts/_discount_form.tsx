import { useState, type FormEvent, type ReactNode } from 'react'
import { addYears, endOfDay, min, startOfDay } from 'date-fns'
import Section from '~/components/section'
import {
  DateRangeCalendarPicker,
  FormButton,
  FormSwitch,
  FormInput,
  FormInputNumber,
  FormSelectWithSearch,
} from '~/components/form'
import { zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { discountSummary, discountTypeMeta, formatActiveDates } from './_format'
import {
  formPayload,
  initialFormState,
  type DiscountFormState,
  type SetDiscountField,
} from './_form_state'
import BxgySection from './_section_bxgy'
import FreeShippingSection from './_section_free_shipping'
import ValueSection from './_section_products_value'
import {
  AdminDiscountFormSchema,
  DiscountMethodSchema,
  type AdminDiscount,
  type AdminDiscountForm,
  type DiscountAppliesTo,
  type DiscountType,
} from './_types'

type DiscountFormProps = {
  type: DiscountType
  discount?: AdminDiscount
  disabled?: boolean
  submitLabel: string
  isPending: boolean
  errors: FieldErrors
  setErrors: (errors: FieldErrors) => void
  onSubmit: (data: AdminDiscountForm) => void
  secondaryAction?: ReactNode
}

/**
 * Fields shared by the create and edit pages, with a section per discount
 * `type`. Validates with Zod and hands the parsed payload to `onSubmit`;
 * server errors come back via `errors`.
 */
export default function DiscountForm({
  type,
  discount,
  disabled = false,
  submitLabel,
  isPending,
  errors,
  setErrors,
  onSubmit,
  secondaryAction,
}: DiscountFormProps) {
  const [state, setState] = useState<DiscountFormState>(() => initialFormState(type, discount))
  const [startsAt, setStartsAt] = useState(() =>
    discount ? new Date(discount.startsAt) : new Date()
  )
  const [endsAt, setEndsAt] = useState<Date | null>(() =>
    discount?.endsAt ? new Date(discount.endsAt) : null
  )
  const [earliestDate] = useState(() => startOfDay(min([new Date(), startsAt])))
  const [latestDate] = useState(() => addYears(new Date(), 5))

  const set: SetDiscountField = (key, value) =>
    setState((current) => ({ ...current, [key]: value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminDiscountFormSchema.safeParse(
      formPayload(type, state, {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt?.toISOString() ?? null,
      })
    )
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    onSubmit(parsed.data)
  }

  const countFor = (appliesTo: DiscountAppliesTo, products: number, collections: number) =>
    appliesTo === 'products' ? products : collections

  const summary = discountSummary({
    type,
    method: state.method,
    code: state.code,
    valueType: state.valueType,
    value: state.value,
    appliesTo: state.appliesTo,
    targetCount: countFor(state.appliesTo, state.products.length, state.collections.length),
    buyRequirement: state.buyRequirement,
    buyValue: state.buyValue,
    buyAppliesTo: state.buyAppliesTo,
    buyTargetCount: countFor(
      state.buyAppliesTo,
      state.buyProducts.length,
      state.buyCollections.length
    ),
    getQuantity: state.getQuantity,
    maxUsesPerOrder: state.maxUsesPerOrder,
    maxShippingPrice: state.maxShippingPrice,
    minSubtotal: state.minSubtotal,
    usageLimit: state.usageLimit,
    oncePerCustomer: state.oncePerCustomer,
    startsAt,
    endsAt,
  })

  return (
    <form className={panel} onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-x-8">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <Section title={discountTypeMeta[type].label}>
            <FormSelectWithSearch
              name="method"
              label="Method"
              value={state.method}
              disabled={disabled}
              onChange={(next) => set('method', DiscountMethodSchema.parse(next))}
              options={[
                {
                  value: 'code',
                  label: 'Discount code',
                  subtitle: 'Applied when the code is entered',
                },
                {
                  value: 'automatic',
                  label: 'Automatic discount',
                  subtitle: 'Applied at checkout to every qualifying order',
                },
              ]}
              error={errors.method ?? errors.type}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                name="title"
                label="Title"
                placeholder="Summer sale"
                autoComplete="off"
                value={state.title}
                disabled={disabled}
                onChange={(event) => set('title', event.target.value)}
                error={errors.title}
              />
              {state.method === 'code' && (
                <FormInput
                  name="code"
                  label="Code"
                  placeholder="SUMMER10"
                  autoComplete="off"
                  className="uppercase"
                  value={state.code}
                  disabled={disabled}
                  onChange={(event) => set('code', event.target.value)}
                  error={errors.code}
                />
              )}
            </div>
          </Section>

          {(type === 'amount_off_order' || type === 'amount_off_products') && (
            <ValueSection type={type} state={state} set={set} disabled={disabled} errors={errors} />
          )}
          {type === 'buy_x_get_y' && (
            <BxgySection state={state} set={set} disabled={disabled} errors={errors} />
          )}
          {type === 'free_shipping' && (
            <FreeShippingSection state={state} set={set} disabled={disabled} errors={errors} />
          )}

          <Section title="Minimum purchase">
            <FormInputNumber
              name="minSubtotal"
              label="Minimum order subtotal (optional)"
              placeholder="No minimum"
              value={state.minSubtotal}
              disabled={disabled}
              onChange={(next) => set('minSubtotal', next)}
              error={errors.minSubtotal}
            />
          </Section>

          <Section title="Usage limits">
            <FormInputNumber
              name="usageLimit"
              label="Total number of uses (optional)"
              placeholder="Unlimited"
              value={state.usageLimit}
              disabled={disabled}
              onChange={(next) => set('usageLimit', next)}
              error={errors.usageLimit}
            />
            <FormSwitch
              name="oncePerCustomer"
              label="Limit to one use per customer"
              checked={state.oncePerCustomer}
              disabled={disabled}
              onChange={(event) => set('oncePerCustomer', event.target.checked)}
              error={errors.oncePerCustomer}
            />
          </Section>
        </div>

        <div className="min-w-0 border-t border-line pt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-my-7 lg:border-t-0 lg:border-l lg:py-7 lg:pl-8">
          <Section title="Summary">
            <p className="text-[13.5px] font-medium text-ink">
              {state.title.trim() || 'Untitled discount'}
            </p>
            <p className="-mt-2 text-[12.5px] text-muted">{discountTypeMeta[type].label}</p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-ink-2">
              {summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>

          <Section title="Active dates">
            <DateRangeCalendarPicker
              name="activeDates"
              label="Start and end dates"
              value={{ startDate: startOfDay(startsAt), endDate: startOfDay(endsAt ?? startsAt) }}
              valueLabel={formatActiveDates(startsAt, endsAt)}
              onChange={({ startDate, endDate }) => {
                setStartsAt(startDate)
                setEndsAt(endOfDay(endDate))
              }}
              onClear={endsAt ? () => setEndsAt(null) : undefined}
              clearLabel="Remove end date"
              minDate={earliestDate}
              maxDate={latestDate}
              closeOnSelect
              disabled={disabled}
              error={errors.startsAt ?? errors.endsAt}
            />
            <p className="-mt-2 text-[12.5px] text-muted">
              Runs from the start of the first day to the end of the last. Clear the end date to
              keep the discount running indefinitely.
            </p>
          </Section>
        </div>

        {!disabled && (
          <div className="flex flex-wrap items-end justify-end gap-2.5 border-t border-line pt-6 lg:col-start-1 lg:row-start-2">
            {secondaryAction}
            <FormButton loading={isPending}>{submitLabel}</FormButton>
          </div>
        )}
      </div>
    </form>
  )
}
