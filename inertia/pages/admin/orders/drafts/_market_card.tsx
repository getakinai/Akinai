import { FormSelectWithSearch } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { card, field } from '~/lib/styles'
import { useCan } from '../../_hooks'
import { useOrderMarkets } from '../_hooks'
import { type DraftOrderQuote } from '../_types'

type MarketCardProps = {
  marketId: string | null
  onChange: (marketId: string | null) => void
  /** Market the latest quote resolved to (chosen, from the address, or primary). */
  resolved: DraftOrderQuote['market'] | null
  errors: FieldErrors
  disabled?: boolean
}

export default function MarketCard({
  marketId,
  onChange,
  resolved,
  errors,
  disabled = false,
}: MarketCardProps) {
  const canViewMarkets = useCan('markets.view')
  const markets = useOrderMarkets(canViewMarkets)

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Pricing</span>
          <h2 className={card.title}>Market</h2>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {canViewMarkets ? (
          <FormSelectWithSearch
            name="marketId"
            label="Market"
            hideLabel
            placeholder="Automatic (from shipping address)"
            options={(markets.data?.data ?? []).map((market) => ({
              value: market.id,
              label: market.name,
              subtitle: market.currencyCode,
            }))}
            value={marketId ?? ''}
            clearable
            showTriggerSubtitle={false}
            isLoading={markets.isLoading}
            disabled={disabled}
            error={errors.marketId}
            onChange={(id) => onChange(id || null)}
          />
        ) : (
          <p className="text-[13.5px] text-ink-2">{resolved?.name ?? 'Automatic'}</p>
        )}

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13.5px]">
          <dt className={field.label}>Currency</dt>
          <dd className="text-right text-ink-2">{resolved?.currencyCode ?? '—'}</dd>
          <dt className={field.label}>Prices</dt>
          <dd className="text-right text-ink-2">
            {resolved ? (resolved.pricesIncludeTax ? 'Include tax' : 'Exclude tax') : '—'}
          </dd>
        </dl>
        {!marketId && resolved && (
          <p className="text-[12.5px] text-muted">Using {resolved.name} for this order.</p>
        )}
      </div>
    </section>
  )
}
