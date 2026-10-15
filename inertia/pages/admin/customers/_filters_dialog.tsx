import { type FormEvent, useState } from 'react'
import {
  DateRangeCalendarPicker,
  FormButton,
  FormInputNumber,
  FormMultiSelect,
  FormSelectWithSearch,
  formatDateRangeToYmd,
  parseDateRangeFromYmd,
} from '~/components/form'
import { Dialog } from '~/components/ui'
import { zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useAdminCustomerFilterOptions } from './_hooks'
import { compactFilters, EMPTY_SEGMENT_FILTERS } from './_segment_filters'
import { AdminCustomerSegmentFiltersSchema, type AdminCustomerSegmentFilters } from './_types'

type FiltersDialogProps = {
  open: boolean
  onClose: () => void
  filters: AdminCustomerSegmentFilters
  onApply: (filters: AdminCustomerSegmentFilters) => void
}

const MARKETING_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'subscribed', label: 'Subscribed' },
  { value: 'not_subscribed', label: 'Not subscribed' },
]

const toNumber = (value: number | null) => (value === null ? undefined : value)
const toNullable = (value: number | undefined) => (value === undefined ? null : value)

/**
 * Filters for tags, marketing consent, country, number of orders, total
 * spent and last order date. Remount (via `key`) to reset the draft.
 */
export default function FiltersDialog({ open, onClose, filters, onApply }: FiltersDialogProps) {
  const options = useAdminCustomerFilterOptions()
  const [draft, setDraft] = useState<AdminCustomerSegmentFilters>(filters)
  const [errors, setErrors] = useState<FieldErrors>({})

  const set = <K extends keyof AdminCustomerSegmentFilters>(
    key: K,
    value: AdminCustomerSegmentFilters[K]
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const currencies = options.data?.currencyCodes ?? []
  const spentCurrency = draft.spentCurrency ?? currencies[0] ?? ''

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const spentSet = draft.spentMin !== undefined || draft.spentMax !== undefined
    const parsed = AdminCustomerSegmentFiltersSchema.safeParse({
      ...draft,
      spentCurrency: spentSet ? spentCurrency || undefined : undefined,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    onApply(compactFilters(parsed.data))
    onClose()
  }

  function onClear() {
    setDraft(EMPTY_SEGMENT_FILTERS)
    setErrors({})
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Filter customers"
      description="Customers must match every filter you set."
      className="w-[min(36rem,calc(100vw-2rem))]"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormMultiSelect
          name="filter-tags"
          label="Has any of these tags"
          placeholder={options.isLoading ? 'Loading tags…' : 'Add a tag…'}
          emptyText="Any tags."
          options={(options.data?.tags ?? []).map((tag) => ({ value: tag, label: tag }))}
          values={draft.tags ?? []}
          onChange={(tags) => set('tags', tags)}
          error={errors.tags}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelectWithSearch
            name="filter-marketing"
            label="Email marketing"
            options={MARKETING_OPTIONS}
            value={draft.marketing ?? ''}
            onChange={(value) =>
              set(
                'marketing',
                value === 'subscribed' || value === 'not_subscribed' ? value : undefined
              )
            }
            error={errors.marketing}
          />
          <FormSelectWithSearch
            name="filter-country"
            label="Country"
            isLoading={options.isLoading}
            options={[
              { value: '', label: 'Any country' },
              ...(options.data?.countries ?? []).map((country) => ({
                value: country.code,
                label: country.name,
              })),
            ]}
            value={draft.countryCode ?? ''}
            onChange={(value) => set('countryCode', value || undefined)}
            error={errors.countryCode}
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-medium text-ink">Number of orders</legend>
          <div className="grid grid-cols-2 gap-3">
            <FormInputNumber
              name="filter-orders-min"
              label="At least"
              min={0}
              step={1}
              value={toNullable(draft.ordersMin)}
              onChange={(value) => set('ordersMin', toNumber(value))}
              error={errors.ordersMin}
            />
            <FormInputNumber
              name="filter-orders-max"
              label="At most"
              min={0}
              step={1}
              value={toNullable(draft.ordersMax)}
              onChange={(value) => set('ordersMax', toNumber(value))}
              error={errors.ordersMax}
            />
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-medium text-ink">Total spent</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormSelectWithSearch
              name="filter-spent-currency"
              label="Currency"
              isLoading={options.isLoading}
              noOptionsText="No orders yet"
              options={currencies.map((code) => ({ value: code, label: code }))}
              value={spentCurrency}
              onChange={(value) => set('spentCurrency', value || undefined)}
              error={errors.spentCurrency}
            />
            <FormInputNumber
              name="filter-spent-min"
              label="At least"
              min={0}
              step="any"
              value={toNullable(draft.spentMin)}
              onChange={(value) => set('spentMin', toNumber(value))}
              error={errors.spentMin}
            />
            <FormInputNumber
              name="filter-spent-max"
              label="At most"
              min={0}
              step="any"
              value={toNullable(draft.spentMax)}
              onChange={(value) => set('spentMax', toNumber(value))}
              error={errors.spentMax}
            />
          </div>
          <p className="text-[12.5px] text-muted">
            Placed orders in that currency, after refunds. Cancelled orders don’t count.
          </p>
        </fieldset>
        <DateRangeCalendarPicker
          name="filter-last-order"
          label="Last order date"
          placeholder="Any date"
          value={parseDateRangeFromYmd(draft.lastOrderFrom, draft.lastOrderTo)}
          onChange={(range) => {
            const { dateFrom, dateTo } = formatDateRangeToYmd(range)
            setDraft((current) => ({ ...current, lastOrderFrom: dateFrom, lastOrderTo: dateTo }))
          }}
          onClear={() =>
            setDraft((current) => ({
              ...current,
              lastOrderFrom: undefined,
              lastOrderTo: undefined,
            }))
          }
          maxDate={new Date()}
          error={errors.lastOrderFrom ?? errors.lastOrderTo}
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear all
          </FormButton>
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm">Apply filters</FormButton>
        </div>
      </form>
    </Dialog>
  )
}
