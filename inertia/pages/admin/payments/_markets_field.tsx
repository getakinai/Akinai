import { useState } from 'react'
import { FormButton, FormMultiSelect, FormSelectWithSearch } from '~/components/form'
import { field } from '~/lib/styles'
import { type AdminPaymentMarket } from './_types'

type Availability = 'all' | 'selected'

type MarketsFieldProps = {
  markets: AdminPaymentMarket[]
  values: string[]
  onChange: (values: string[]) => void
  error?: string
  methodName?: string
  emptyText?: string
  allLabel?: string
}

/**
 * Picks the markets a payment method is shown in: every active market in
 * one step, or a searchable list for stores with many markets.
 */
export default function MarketsField({
  markets,
  values,
  onChange,
  error,
  methodName = 'Stripe',
  emptyText,
  allLabel = 'All active markets',
}: MarketsFieldProps) {
  const allIds = markets.map((market) => market.id)
  const coversAll = markets.length > 0 && allIds.every((id) => values.includes(id))
  const [availability, setAvailability] = useState<Availability>(coversAll ? 'all' : 'selected')

  if (markets.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        {emptyText ?? `Add an active market to offer ${methodName}.`}
      </p>
    )
  }

  function changeAvailability(next: string) {
    const value: Availability = next === 'all' ? 'all' : 'selected'
    setAvailability(value)
    onChange(value === 'all' ? allIds : values.filter((id) => allIds.includes(id)))
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <FormSelectWithSearch
        name="marketAvailability"
        label="Show at checkout in"
        tooltip={`Markets added later aren’t included automatically. Come back here to offer ${methodName} in them.`}
        value={availability}
        onChange={changeAvailability}
        options={[
          { value: 'all', label: `${allLabel} (${markets.length})` },
          { value: 'selected', label: 'Selected markets' },
        ]}
        error={availability === 'all' ? error : undefined}
      />
      {availability === 'selected' && (
        <>
          <FormMultiSelect
            name="marketIds"
            label="Add a market"
            placeholder="Search markets…"
            emptyText={`Not shown in any market yet, so customers can’t pay with ${methodName}.`}
            options={markets.map((market) => ({
              value: market.id,
              label: market.name,
              subtitle: market.currencyCode,
              searchText: [market.name, market.currencyCode, ...market.countryCodes].join(' '),
            }))}
            values={values}
            onChange={onChange}
            listClassName="max-h-36 overflow-y-auto"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-muted">
              {values.length} of {markets.length} markets selected
            </span>
            {values.length > 0 && (
              <FormButton type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
                Clear all
              </FormButton>
            )}
          </div>
          {error && <span className={field.error}>{error}</span>}
        </>
      )}
    </div>
  )
}
