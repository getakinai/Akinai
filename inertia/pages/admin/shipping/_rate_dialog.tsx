import { useState, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
  FormButton,
  FormSwitch,
  FormInput,
  FormInputNumber,
  FormSelectWithSearch,
  FormTextarea,
} from '~/components/form'
import { Badge, Dialog, IconButton, InfoTooltip } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useWeightUnit } from '~/pages/_hooks'
import { usePricingMarkets, usePrimaryPricingMarket } from '../_hooks'
import {
  SHIPPING_MARKETS_URL,
  useCreateAdminShippingRate,
  useUpdateAdminShippingRate,
} from './_hooks'
import { AdminShippingRateFormSchema, type AdminShippingRate } from './_types'

type MarketPriceDraft = {
  price: number | null
  minSubtotal: number | null
  maxSubtotal: number | null
}

const EMPTY_DRAFT: MarketPriceDraft = { price: null, minSubtotal: null, maxSubtotal: null }

type RateDialogProps = {
  open: boolean
  zoneId: string
  rate: AdminShippingRate | null
  onClose: () => void
}

const isSet = (...values: (number | null | undefined)[]) =>
  values.some((value) => value !== null && value !== undefined)

/**
 * Adds a rate to the zone when `rate` is null, otherwise edits it. Remount
 * with a new `key` to reset the fields between rates.
 */
export default function RateDialog({ open, zoneId, rate, onClose }: RateDialogProps) {
  const [name, setName] = useState(rate?.name ?? '')
  const [description, setDescription] = useState(rate?.description ?? '')
  const [price, setPrice] = useState<number | null>(rate?.price ?? null)
  const [minSubtotal, setMinSubtotal] = useState<number | null>(rate?.minSubtotal ?? null)
  const [maxSubtotal, setMaxSubtotal] = useState<number | null>(rate?.maxSubtotal ?? null)
  const [minWeight, setMinWeight] = useState<number | null>(rate?.minWeight ?? null)
  const [maxWeight, setMaxWeight] = useState<number | null>(rate?.maxWeight ?? null)
  const [minItems, setMinItems] = useState<number | null>(rate?.minItems ?? null)
  const [maxItems, setMaxItems] = useState<number | null>(rate?.maxItems ?? null)
  const [isActive, setIsActive] = useState(rate?.isActive ?? true)
  const [byValue, setByValue] = useState(
    isSet(
      rate?.minSubtotal,
      rate?.maxSubtotal,
      ...(rate?.marketPrices ?? []).flatMap((entry) => [entry.minSubtotal, entry.maxSubtotal])
    )
  )
  const [byWeight, setByWeight] = useState(isSet(rate?.minWeight, rate?.maxWeight))
  const [byItems, setByItems] = useState(isSet(rate?.minItems, rate?.maxItems))
  const weightUnit = useWeightUnit()
  const { data: markets = [] } = usePricingMarkets(SHIPPING_MARKETS_URL)
  const { data: primaryMarket } = usePrimaryPricingMarket(SHIPPING_MARKETS_URL)
  const [addedIds, setAddedIds] = useState<string[]>(
    () => rate?.marketPrices.map(({ marketId }) => marketId) ?? []
  )
  const [justAddedId, setJustAddedId] = useState<string | null>(null)
  const [marketPrices, setMarketPrices] = useState<Record<string, MarketPriceDraft>>(() =>
    Object.fromEntries(
      (rate?.marketPrices ?? []).map((entry) => [
        entry.marketId,
        { price: entry.price, minSubtotal: entry.minSubtotal, maxSubtotal: entry.maxSubtotal },
      ])
    )
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const createRate = useCreateAdminShippingRate(zoneId)
  const updateRate = useUpdateAdminShippingRate(zoneId)
  const isPending = createRate.isPending || updateRate.isPending

  const addedMarkets = addedIds.flatMap((id) => markets.filter((market) => market.id === id))
  const availableMarkets = markets.filter(({ id }) => !addedIds.includes(id))
  const marketEntries = addedMarkets.flatMap(({ id }) => {
    const draft = marketPrices[id] ?? EMPTY_DRAFT
    if (draft.price === null) return []
    return [
      {
        marketId: id,
        price: draft.price,
        minSubtotal: byValue ? draft.minSubtotal : null,
        maxSubtotal: byValue ? draft.maxSubtotal : null,
      },
    ]
  })

  function setMarketField(marketId: string, field: keyof MarketPriceDraft, value: number | null) {
    setMarketPrices((current) => ({
      ...current,
      [marketId]: { ...(current[marketId] ?? EMPTY_DRAFT), [field]: value },
    }))
  }

  function addMarket(marketId: string) {
    if (!marketId) return
    setAddedIds((current) => [...current, marketId])
    setJustAddedId(marketId)
  }

  function removeMarket(marketId: string) {
    setAddedIds((current) => current.filter((id) => id !== marketId))
    setMarketPrices(({ [marketId]: _removed, ...rest }) => rest)
  }

  const marketFieldError = (marketId: string, field: string) => {
    const index = marketEntries.findIndex((entry) => entry.marketId === marketId)
    return index === -1 ? undefined : errors[`marketPrices.${index}.${field}`]
  }

  const primaryName = primaryMarket?.name ?? 'Primary market'
  const primaryCurrency = primaryMarket?.currencyCode

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const unpriced = addedMarkets.filter(
      ({ id }) => (marketPrices[id] ?? EMPTY_DRAFT).price === null
    )
    const parsed = AdminShippingRateFormSchema.safeParse({
      name,
      description: emptyToNull(description),
      price,
      minSubtotal: byValue ? minSubtotal : null,
      maxSubtotal: byValue ? maxSubtotal : null,
      minWeight: byWeight ? minWeight : null,
      maxWeight: byWeight ? maxWeight : null,
      minItems: byItems ? minItems : null,
      maxItems: byItems ? maxItems : null,
      isActive,
      marketPrices: markets.length > 0 ? marketEntries : undefined,
    })
    const unpricedErrors = Object.fromEntries(
      unpriced.map(({ id }) => [`addedMarket.${id}`, 'Enter a price or remove this market'])
    )
    if (!parsed.success || unpriced.length > 0) {
      return setErrors({
        ...(parsed.success ? {} : zodFieldErrors(parsed.error)),
        ...unpricedErrors,
      })
    }

    setErrors({})
    const options = {
      onSuccess: (saved: AdminShippingRate) => {
        toast.success(rate ? `${saved.name} updated` : `${saved.name} added`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (rate) {
      updateRate.mutate({ rateId: rate.id, ...parsed.data }, options)
    } else {
      createRate.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={rate ? 'Edit rate' : 'Add rate'}>
      <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
        <RateGroup title="Rate" tooltip="Shoppers see the name and description at checkout.">
          <FormInput
            name="rateName"
            label="Name"
            placeholder="Standard delivery"
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
            autoFocus
          />
          <FormTextarea
            name="rateDescription"
            label="Description (optional)"
            placeholder="Takes 2–3 business days"
            rows={2}
            maxLength={255}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            error={errors.description}
          />
        </RateGroup>

        <RateGroup
          title="Price"
          aside={
            markets.length > 0
              ? `${1 + addedMarkets.length} of ${markets.length + 1} markets`
              : undefined
          }
          tooltip={
            markets.length > 0
              ? 'What shoppers pay in each market; enter 0 for free shipping. The rate is only offered in the markets listed here.'
              : 'What shoppers pay; enter 0 for free shipping.'
          }
        >
          <ul className="max-h-[420px] divide-y divide-line-2 overflow-y-auto rounded-lg border border-line-2">
            <MarketRow
              name={primaryName}
              currencyCode={primaryCurrency}
              primary
              price={
                <PriceInput
                  id="ratePrice"
                  market={primaryName}
                  currencyCode={primaryCurrency}
                  value={price}
                  onChange={setPrice}
                  error={errors.price}
                />
              }
            >
              {byValue && (
                <RangeInputs
                  id="rateSubtotal"
                  label="Order value"
                  unit={primaryCurrency}
                  min={minSubtotal}
                  max={maxSubtotal}
                  onMinChange={setMinSubtotal}
                  onMaxChange={setMaxSubtotal}
                  minError={errors.minSubtotal}
                  maxError={errors.maxSubtotal}
                />
              )}
            </MarketRow>
            {addedMarkets.map((market) => {
              const draft = marketPrices[market.id] ?? EMPTY_DRAFT
              return (
                <MarketRow
                  key={market.id}
                  name={market.name}
                  currencyCode={market.currencyCode}
                  onRemove={() => removeMarket(market.id)}
                  price={
                    <PriceInput
                      id={`rateMarketPrice-${market.id}`}
                      market={market.name}
                      currencyCode={market.currencyCode}
                      value={draft.price}
                      onChange={(amount) => setMarketField(market.id, 'price', amount)}
                      error={
                        errors[`addedMarket.${market.id}`] ?? marketFieldError(market.id, 'price')
                      }
                      autoFocus={justAddedId === market.id}
                    />
                  }
                >
                  {byValue && (
                    <RangeInputs
                      id={`rateMarketSubtotal-${market.id}`}
                      label="Order value"
                      unit={market.currencyCode}
                      min={draft.minSubtotal}
                      max={draft.maxSubtotal}
                      onMinChange={(amount) => setMarketField(market.id, 'minSubtotal', amount)}
                      onMaxChange={(amount) => setMarketField(market.id, 'maxSubtotal', amount)}
                      minError={marketFieldError(market.id, 'minSubtotal')}
                      maxError={marketFieldError(market.id, 'maxSubtotal')}
                    />
                  )}
                </MarketRow>
              )
            })}
          </ul>

          {markets.length > 0 && addedMarkets.length === 0 && (
            <p className="text-[12.5px] text-muted">
              Only offered in {primaryName}. Add a market to offer it there too.
            </p>
          )}

          {availableMarkets.length > 0 && (
            <FormSelectWithSearch
              name="rateAddMarket"
              label="Add a market"
              hideLabel
              placeholder="Add a market"
              searchPlaceholder="Search markets"
              noOptionsText="No markets match"
              options={availableMarkets.map((market) => ({
                value: market.id,
                label: market.name,
                subtitle: market.currencyCode,
              }))}
              value=""
              onChange={addMarket}
            />
          )}

          <FormSwitch
            name="rateByValue"
            label="Limit by order value"
            tooltip="Set a minimum or maximum cart subtotal in each market's currency, e.g. a free rate for orders over 50."
            checked={byValue}
            onChange={(event) => setByValue(event.target.checked)}
          />
        </RateGroup>

        <RateGroup
          title="Conditions"
          tooltip="Optional. Only offer this rate when the cart matches every condition you turn on."
        >
          <Condition
            name="rateByWeight"
            label="Order weight"
            tooltip="Total weight of the items in the cart."
            checked={byWeight}
            onChange={setByWeight}
          >
            <RangeInputs
              id="rateWeight"
              unit={weightUnit}
              min={minWeight}
              max={maxWeight}
              onMinChange={setMinWeight}
              onMaxChange={setMaxWeight}
              minError={errors.minWeight}
              maxError={errors.maxWeight}
            />
          </Condition>
          <Condition
            name="rateByItems"
            label="Number of items"
            tooltip="Total quantity in the cart."
            checked={byItems}
            onChange={setByItems}
          >
            <RangeInputs
              id="rateItems"
              min={minItems}
              max={maxItems}
              onMinChange={setMinItems}
              onMaxChange={setMaxItems}
              minError={errors.minItems}
              maxError={errors.maxItems}
            />
          </Condition>
        </RateGroup>

        <FormSwitch
          name="rateIsActive"
          label="Offer this rate at checkout"
          tooltip="Turn off to hide it without deleting it."
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          error={errors.isActive}
        />

        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {rate ? 'Save changes' : 'Add rate'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}

function RateGroup({
  title,
  tooltip,
  aside,
  children,
}: {
  title: string
  tooltip?: string
  aside?: string
  children: ReactNode
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="contents">
        <span className="relative flex flex-wrap items-center justify-between gap-x-3">
          <span className="flex items-center gap-1">
            <span className="text-[13.5px] font-semibold text-ink">{title}</span>
            {tooltip && <InfoTooltip label={`About ${title.toLowerCase()}`}>{tooltip}</InfoTooltip>}
          </span>
          {aside && <span className="text-[12px] text-muted">{aside}</span>}
        </span>
      </legend>
      {children}
    </fieldset>
  )
}

function Condition({
  name,
  label,
  tooltip,
  checked,
  onChange,
  children,
}: {
  name: string
  label: string
  tooltip: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line-2 px-3 py-2.5">
      <FormSwitch
        name={name}
        label={label}
        tooltip={tooltip}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {checked && children}
    </div>
  )
}

/**
 * One market in the price list: its name and currency beside the price
 * input, with any extra fields (order value limits) underneath.
 */
function MarketRow({
  name,
  currencyCode,
  primary = false,
  price,
  onRemove,
  children,
}: {
  name: string
  currencyCode: string | undefined
  primary?: boolean
  price: ReactNode
  onRemove?: () => void
  children?: ReactNode
}) {
  return (
    <li className="flex flex-col gap-2 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="flex min-h-10 min-w-0 flex-1 flex-col justify-center">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[13.5px] font-medium text-ink">{name}</span>
            {primary && <Badge tone="info">Primary</Badge>}
          </span>
          {currencyCode && <span className="text-[12px] text-muted">{currencyCode}</span>}
        </div>
        {price}
        {onRemove && (
          <div className="flex min-h-10 flex-none items-center">
            <IconButton label={`Remove ${name}`} size="sm" onClick={onRemove}>
              <X size={15} />
            </IconButton>
          </div>
        )}
      </div>
      {children}
    </li>
  )
}

function PriceInput({
  id,
  market,
  currencyCode,
  value,
  onChange,
  error,
  autoFocus,
}: {
  id: string
  market: string
  currencyCode: string | undefined
  value: number | null
  onChange: (value: number | null) => void
  error?: string
  autoFocus?: boolean
}) {
  return (
    <div className="w-28 flex-none sm:w-36">
      <FormInputNumber
        name={id}
        label={currencyCode ? `Price in ${market} (${currencyCode})` : `Price in ${market}`}
        hideLabel
        placeholder="0.00"
        value={value}
        onChange={onChange}
        error={error}
        autoFocus={autoFocus}
      />
    </div>
  )
}

function RangeInputs({
  id,
  label,
  unit,
  min,
  max,
  onMinChange,
  onMaxChange,
  minError,
  maxError,
}: {
  id: string
  /** Prefix for the field labels, e.g. "Order value". */
  label?: string
  unit?: string
  min: number | null
  max: number | null
  onMinChange: (value: number | null) => void
  onMaxChange: (value: number | null) => void
  minError?: string
  maxError?: string
}) {
  const prefix = label ? `${label} ` : ''
  const suffix = unit ? ` (${unit})` : ''
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <FormInputNumber
        name={`${id}Min`}
        label={`${prefix}${label ? 'min' : 'Minimum'}${suffix}`}
        placeholder="No minimum"
        value={min}
        onChange={onMinChange}
        error={minError}
      />
      <FormInputNumber
        name={`${id}Max`}
        label={`${prefix}${label ? 'max' : 'Maximum'}${suffix}`}
        placeholder="No maximum"
        value={max}
        onChange={onMaxChange}
        error={maxError}
      />
    </div>
  )
}
