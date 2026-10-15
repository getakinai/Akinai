import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import Section from '~/components/section'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { panel } from '~/lib/styles'
import { usePricingMarkets, usePrimaryPricingMarket } from '../_hooks'
import { formatPrice } from './_format'
import { useUpdateAdminVariant } from './_hooks'
import MarketPriceFields from './_market_price_fields'
import {
  marketPriceDraft,
  marketPriceEntries,
  PRODUCT_PRICING_MARKETS_URL,
  sameMarketPrices,
  type MarketPriceDraft,
} from './_market_prices'
import { VariantFormSchema, type AdminProductDetail, type AdminVariant } from './_types'

type PricingCardProps = {
  product: AdminProductDetail
  editable: boolean
}

type PriceDraft = {
  price: number | null
  compareAtPrice: number | null
  marketPrices: MarketPriceDraft
}

function savedPrices(variant: AdminVariant): PriceDraft {
  return {
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    marketPrices: marketPriceDraft(variant.marketPrices),
  }
}

/**
 * Prices of one variant at a time, in every market. Unsaved edits are kept
 * per variant while switching between them; Save sends the selected one.
 */
export default function PricingCard({ product, editable }: PricingCardProps) {
  const { data: markets = [] } = usePricingMarkets(PRODUCT_PRICING_MARKETS_URL)
  const { data: primaryMarket } = usePrimaryPricingMarket(PRODUCT_PRICING_MARKETS_URL)
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id ?? '')
  const [drafts, setDrafts] = useState<Record<string, PriceDraft>>({})
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({})
  const updateVariant = useUpdateAdminVariant()

  const variant = product.variants.find(({ id }) => id === selectedId) ?? product.variants[0]
  if (!variant) return null

  function isDirty(target: AdminVariant) {
    const draft = drafts[target.id]
    if (!draft) return false
    return (
      draft.price !== target.price ||
      draft.compareAtPrice !== target.compareAtPrice ||
      !sameMarketPrices(draft.marketPrices, marketPriceDraft(target.marketPrices), markets)
    )
  }

  const current = drafts[variant.id] ?? savedPrices(variant)
  const currentErrors = errors[variant.id] ?? {}
  const dirty = isDirty(variant)

  function update(patch: Partial<PriceDraft>) {
    setDrafts((all) => ({ ...all, [variant.id]: { ...current, ...patch } }))
  }

  function setVariantErrors(variantId: string, next: FieldErrors) {
    setErrors((all) => ({ ...all, [variantId]: next }))
  }

  function discard() {
    setDrafts(({ [variant.id]: _dropped, ...rest }) => rest)
    setVariantErrors(variant.id, {})
  }

  function onSave() {
    const target = variant
    const parsed = VariantFormSchema.safeParse({
      sku: target.sku,
      barcode: target.barcode,
      price: current.price,
      compareAtPrice: current.compareAtPrice,
      weight: target.weight,
      trackInventory: target.trackInventory,
      marketPrices:
        markets.length > 0 ? marketPriceEntries(markets, current.marketPrices) : undefined,
    })
    if (!parsed.success) return setVariantErrors(target.id, zodFieldErrors(parsed.error))

    setVariantErrors(target.id, {})
    updateVariant.mutate(
      { productId: target.productId, id: target.id, ...parsed.data },
      {
        onSuccess: (saved) => {
          setDrafts(({ [target.id]: _saved, ...rest }) => rest)
          toast.success(`${saved.title} prices saved`)
        },
        onError: (error) => handleMutationError(error, (next) => setVariantErrors(target.id, next)),
      }
    )
  }

  const variantOptions = product.variants.map((option) => {
    const draft = drafts[option.id] ?? savedPrices(option)
    const invalid = Object.keys(errors[option.id] ?? {}).length > 0
    return {
      value: option.id,
      label: option.title,
      subtitle: [option.sku, draft.price === null ? null : formatPrice(draft.price)]
        .filter(Boolean)
        .join(' · '),
      searchText: `${option.title} ${option.sku ?? ''}`,
      badge: invalid
        ? { label: 'Fix price', tone: 'danger' as const }
        : isDirty(option)
          ? { label: 'Unsaved', tone: 'warning' as const }
          : undefined,
    }
  })

  return (
    <div className={panel}>
      <Section title="Market prices">
        {product.variants.length > 1 && (
          <FormSelectWithSearch
            name="pricingVariant"
            label="Variant"
            searchPlaceholder="Search variants…"
            value={variant.id}
            onChange={setSelectedId}
            options={variantOptions}
            showTriggerSubtitle={false}
            tooltip="Pick a variant to set its price in each market. Edits are kept while you switch variants until you save or discard them."
          />
        )}

        <MarketPriceFields
          primaryMarket={primaryMarket}
          markets={markets}
          price={current.price}
          onPriceChange={(price) => update({ price })}
          compareAtPrice={current.compareAtPrice}
          onCompareAtPriceChange={(compareAtPrice) => update({ compareAtPrice })}
          marketPrices={current.marketPrices}
          onMarketPricesChange={(marketPrices) => update({ marketPrices })}
          errors={currentErrors}
          disabled={!editable}
        />

        {editable && (
          <div className="flex flex-wrap justify-end gap-2.5">
            {dirty && (
              <FormButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={updateVariant.isPending}
                onClick={discard}
              >
                Discard
              </FormButton>
            )}
            <FormButton
              type="button"
              size="sm"
              disabled={!dirty}
              loading={updateVariant.isPending}
              loadingText="Saving…"
              onClick={onSave}
            >
              Save prices
            </FormButton>
          </div>
        )}
      </Section>
    </div>
  )
}
