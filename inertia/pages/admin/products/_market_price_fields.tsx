import { useState } from 'react'
import { FormInputNumber, FormSelectWithSearch } from '~/components/form'
import { type FieldErrors } from '~/lib/http'
import { cn } from '~/lib/styles'
import { type PricingMarket } from '../_types'
import { formatPrice } from './_format'
import { marketPriceErrorPath, type MarketPriceDraft } from './_market_prices'

type CompareAtProps = {
  compareAtPrice: number | null
  onCompareAtPriceChange: (value: number | null) => void
}

type MarketPriceFieldsProps = {
  primaryMarket: PricingMarket | null | undefined
  /** Non-primary markets that take their own prices. */
  markets: PricingMarket[]
  price: number | null
  onPriceChange: (value: number | null) => void
  marketPrices: MarketPriceDraft
  onMarketPricesChange: (value: MarketPriceDraft) => void
  errors: FieldErrors
  disabled?: boolean
} & (CompareAtProps | { compareAtPrice?: never; onCompareAtPriceChange?: never })

const PRIMARY = ''

/**
 * One price input that starts on the store's primary market. The market
 * dropdown switches the input to another market's own price; a blank market
 * price means the variant isn't sold there.
 */
export default function MarketPriceFields({
  primaryMarket,
  markets,
  price,
  onPriceChange,
  compareAtPrice,
  onCompareAtPriceChange,
  marketPrices,
  onMarketPricesChange,
  errors,
  disabled,
}: MarketPriceFieldsProps) {
  const [selected, setSelected] = useState(PRIMARY)
  const withCompareAt = onCompareAtPriceChange !== undefined
  const market = markets.find(({ id }) => id === selected)
  const isPrimary = !market
  const currency = market?.currencyCode ?? primaryMarket?.currencyCode

  function marketErrors(marketId: string) {
    const path = marketPriceErrorPath(markets, marketPrices, marketId)
    return {
      price: path ? errors[`${path}.price`] : undefined,
      compareAtPrice: path ? errors[`${path}.compareAtPrice`] : undefined,
    }
  }

  function updateMarket(field: 'price' | 'compareAtPrice', amount: number | null) {
    if (!market) return
    const current = marketPrices[market.id] ?? { price: null, compareAtPrice: null }
    onMarketPricesChange({ ...marketPrices, [market.id]: { ...current, [field]: amount } })
  }

  const entry = market ? marketPrices[market.id] : undefined
  const fieldErrors = market
    ? marketErrors(market.id)
    : { price: errors.price, compareAtPrice: errors.compareAtPrice }
  const withCurrency = (label: string) => (currency ? `${label} (${currency})` : label)

  const options = [
    {
      value: PRIMARY,
      label: primaryMarket?.name ?? 'Store default',
      subtitle: primaryMarket?.currencyCode,
      badge: { label: 'Default', tone: 'info' as const },
    },
    ...markets.map(({ id, name, currencyCode }) => {
      const amount = marketPrices[id]?.price ?? null
      const hasError = Boolean(marketErrors(id).price || marketErrors(id).compareAtPrice)
      return {
        value: id,
        label: name,
        subtitle: `${currencyCode} · ${amount === null ? 'Not sold' : formatPrice(amount)}`,
        searchText: `${name} ${currencyCode}`,
        badge: hasError ? { label: 'Fix price', tone: 'danger' as const } : undefined,
      }
    }),
  ]

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        className={cn(
          'grid grid-cols-1 gap-4',
          withCompareAt ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
        )}
      >
        {markets.length > 0 && (
          <FormSelectWithSearch
            name="priceMarket"
            label="Market"
            searchPlaceholder="Search markets…"
            value={selected}
            onChange={setSelected}
            options={options}
            showTriggerSubtitle={false}
          />
        )}
        <FormInputNumber
          key={`price-${selected}`}
          name={isPrimary ? 'price' : `marketPrice-${selected}`}
          label={withCurrency('Price')}
          placeholder={isPrimary ? '0.00' : 'Not sold'}
          value={isPrimary ? price : (entry?.price ?? null)}
          disabled={disabled}
          onChange={isPrimary ? onPriceChange : (amount) => updateMarket('price', amount)}
          error={fieldErrors.price}
        />
        {withCompareAt && (
          <FormInputNumber
            key={`compare-${selected}`}
            name={isPrimary ? 'compareAtPrice' : `marketCompareAtPrice-${selected}`}
            label={withCurrency('Original price')}
            placeholder="—"
            value={isPrimary ? (compareAtPrice ?? null) : (entry?.compareAtPrice ?? null)}
            disabled={disabled}
            onChange={
              isPrimary
                ? onCompareAtPriceChange
                : (amount) => updateMarket('compareAtPrice', amount)
            }
            error={fieldErrors.compareAtPrice}
          />
        )}
      </div>
      {(markets.length > 0 || withCompareAt) && (
        <p className="text-[12.5px] text-muted">
          {markets.length > 0 &&
            (isPrimary
              ? 'The store default price. Pick another market to set its own price. '
              : `Leave blank to not sell in ${market.name}. `)}
          {withCompareAt &&
            'For a promo, set the sale price and put the regular price in Original price; the store shows it struck through.'}
        </p>
      )}
    </div>
  )
}
