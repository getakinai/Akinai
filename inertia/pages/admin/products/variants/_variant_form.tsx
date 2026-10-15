import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { FormButton, FormSwitch, FormInput, FormInputNumber, FormSelect } from '~/components/form'
import Section from '~/components/section'
import { emptyToNull, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { inlineLink, panel } from '~/lib/styles'
import { useWeightUnit } from '~/pages/_hooks'
import { usePricingMarkets, usePrimaryPricingMarket } from '../../_hooks'
import { useAdminOptionsCatalog } from '../../options/_hooks'
import { type AdminOptionCatalogEntry } from '../../options/_types'
import MarketPriceFields from '../_market_price_fields'
import {
  marketPriceDraft,
  marketPriceEntries,
  PRODUCT_PRICING_MARKETS_URL,
} from '../_market_prices'
import {
  VariantDetailFormSchema,
  type AdminProductDetail,
  type AdminVariant,
  type VariantDetailForm,
} from '../_types'

type VariantFormProps = {
  product: AdminProductDetail
  /** The variant being edited; omit when adding a variant. */
  variant?: AdminVariant
  editable: boolean
  pending: boolean
  submitLabel: string
  errors: FieldErrors
  setErrors: (errors: FieldErrors) => void
  onSubmit: (data: VariantDetailForm) => void
  onCancel: () => void
  /** Extra buttons shown on the left of the footer (e.g. Delete). */
  footerStart?: ReactNode
}

const comboKey = (ids: string[]) => [...ids].sort().join('|')

type ProductOption = AdminProductDetail['options'][number]

/**
 * Values to pick for `option`: the product's own values, plus catalog values
 * of the option's definition the product does not use yet (sent by catalog
 * id; the server adds them to the option).
 */
function optionChoices(option: ProductOption, catalog: AdminOptionCatalogEntry[]) {
  const choices = option.values.map(({ id, value }) => ({ value: id, label: value }))
  const entry = catalog.find(({ id }) => id === option.optionDefinitionId)
  if (!entry) return choices

  const used = new Set(option.values.map(({ optionDefinitionValueId }) => optionDefinitionValueId))
  return [
    ...choices,
    ...entry.values
      .filter(({ id }) => !used.has(id))
      .map(({ id, value }) => ({ value: id, label: value })),
  ]
}

/**
 * The first combination of the product's option values that no variant uses
 * yet, so a new variant starts on a free combination. Starts blank when every
 * combination is taken, so a catalog value can be picked instead.
 */
function firstFreeCombination(product: AdminProductDetail): Record<string, string> {
  const taken = new Set(product.variants.map(({ optionValueIds }) => comboKey(optionValueIds)))
  let rows: string[][] = [[]]
  for (const option of product.options) {
    rows = rows.flatMap((prefix) => option.values.map(({ id }) => [...prefix, id]))
  }
  const free = rows.find((ids) => !taken.has(comboKey(ids))) ?? []
  return Object.fromEntries(product.options.map((option, index) => [option.id, free[index] ?? '']))
}

function initialSelection(
  product: AdminProductDetail,
  variant?: AdminVariant
): Record<string, string> {
  if (!variant) return firstFreeCombination(product)
  const picked = new Set(variant.optionValueIds)
  return Object.fromEntries(
    product.options.map((option) => [
      option.id,
      option.values.find(({ id }) => picked.has(id))?.id ?? '',
    ])
  )
}

/**
 * Shared create/edit form for one variant of `product`. Option values come
 * from the product's options: one select per option.
 */
export default function VariantForm({
  product,
  variant,
  editable,
  pending,
  submitLabel,
  errors,
  setErrors,
  onSubmit,
  onCancel,
  footerStart,
}: VariantFormProps) {
  const { data: catalog = [] } = useAdminOptionsCatalog()
  const [selection, setSelection] = useState(() => initialSelection(product, variant))
  const [sku, setSku] = useState(variant?.sku ?? '')
  const [barcode, setBarcode] = useState(variant?.barcode ?? '')
  const [price, setPrice] = useState<number | null>(
    variant?.price ?? product.variants[0]?.price ?? null
  )
  const [compareAtPrice, setCompareAtPrice] = useState<number | null>(
    variant?.compareAtPrice ?? null
  )
  const [trackInventory, setTrackInventory] = useState(variant?.trackInventory ?? false)
  const [weight, setWeight] = useState<number | null>(
    variant?.weight ?? product.variants[0]?.weight ?? null
  )
  const weightUnit = useWeightUnit()
  const { data: markets = [] } = usePricingMarkets(PRODUCT_PRICING_MARKETS_URL)
  const { data: primaryMarket } = usePrimaryPricingMarket(PRODUCT_PRICING_MARKETS_URL)
  const [marketPrices, setMarketPrices] = useState(() =>
    marketPriceDraft(variant?.marketPrices ?? product.variants[0]?.marketPrices)
  )

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = VariantDetailFormSchema.safeParse({
      optionValueIds: product.options.map((option) => selection[option.id]),
      sku: emptyToNull(sku),
      barcode: emptyToNull(barcode),
      price,
      compareAtPrice,
      weight,
      trackInventory,
      marketPrices: markets.length > 0 ? marketPriceEntries(markets, marketPrices) : undefined,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    onSubmit(parsed.data)
  }

  return (
    <form className={panel} onSubmit={handleSubmit} noValidate>
      {product.options.length > 0 && (
        <Section
          title="Options"
          description="Pick one value per option. Each combination can only be used by one variant."
        >
          <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
            {product.options.map((option, index) => (
              <FormSelect
                key={option.id}
                name={`option-${option.id}`}
                label={option.name}
                value={selection[option.id] ?? ''}
                disabled={!editable}
                onChange={(event) =>
                  setSelection((current) => ({ ...current, [option.id]: event.target.value }))
                }
                error={errors[`optionValueIds.${index}`]}
                options={[
                  { value: '', label: `Choose ${option.name.toLowerCase()}` },
                  ...optionChoices(option, catalog),
                ]}
              />
            ))}
          </div>
          {errors.optionValueIds && (
            <span className="text-[12.5px] text-danger">{errors.optionValueIds}</span>
          )}
          {editable && (
            <Link
              route="admin.products.edit"
              routeParams={{ id: product.id }}
              className={`self-start text-[13px] ${inlineLink}`}
            >
              Add another option, like Color, on the product’s Pricing tab
            </Link>
          )}
        </Section>
      )}

      <Section title="Pricing">
        <MarketPriceFields
          primaryMarket={primaryMarket}
          markets={markets}
          price={price}
          onPriceChange={setPrice}
          compareAtPrice={compareAtPrice}
          onCompareAtPriceChange={setCompareAtPrice}
          marketPrices={marketPrices}
          onMarketPricesChange={setMarketPrices}
          errors={errors}
          disabled={!editable}
        />
      </Section>

      <Section title="Identifiers">
        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <FormInput
            name="sku"
            label="SKU"
            autoComplete="off"
            value={sku}
            disabled={!editable}
            onChange={(event) => setSku(event.target.value)}
            error={errors.sku}
          />
          <FormInput
            name="barcode"
            label="Barcode"
            autoComplete="off"
            value={barcode}
            disabled={!editable}
            onChange={(event) => setBarcode(event.target.value)}
            error={errors.barcode}
          />
        </div>
      </Section>

      <Section title="Shipping" description="Used for weight-based shipping rates.">
        <FormInputNumber
          name="weight"
          label={`Weight (${weightUnit})`}
          placeholder="0.0"
          value={weight}
          disabled={!editable}
          onChange={setWeight}
          error={errors.weight}
        />
      </Section>

      <Section
        title="Inventory"
        description="Track stock to set the units available at each location."
      >
        <FormSwitch
          name="trackInventory"
          label="Track inventory"
          checked={trackInventory}
          disabled={!editable}
          onChange={(event) => setTrackInventory(event.target.checked)}
        />
      </Section>

      <div className="mt-7 flex items-center justify-between gap-2.5">
        <div>{footerStart}</div>
        <div className="flex gap-2.5">
          <FormButton type="button" variant="secondary" onClick={onCancel}>
            {editable ? 'Cancel' : 'Back'}
          </FormButton>
          {editable && <FormButton loading={pending}>{submitLabel}</FormButton>}
        </div>
      </div>
    </form>
  )
}
