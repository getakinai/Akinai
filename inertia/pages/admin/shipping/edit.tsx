import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import Page from '~/components/page'
import Section from '~/components/section'
import { DataTable, type DataTableColumn } from '~/components/data_table'
import { FormButton, FormInput, FormMultiSelect } from '~/components/form'
import { Badge, Dialog, IconButton, InfoTooltip, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { COUNTRY_OPTIONS, countryName } from '~/lib/countries'
import { regionCountryCode } from '~/lib/country_regions'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { HttpError, type FieldErrors } from '~/lib/http'
import { shippingExamplesFor } from '~/lib/shipping_examples'
import { card, dataTable, panel } from '~/lib/styles'
import { useOperatingCountry, useWeightUnit } from '~/pages/_hooks'
import { formatPrice } from '../products/_format'
import { usePricingMarkets, usePrimaryPricingMarket } from '../_hooks'
import { formatItemRange, formatSubtotalRange, formatWeightRange } from './_format'
import { type PricingMarket } from '../_types'
import {
  SHIPPING_MARKETS_URL,
  useAdminShippingMarketCountries,
  useAdminShippingZone,
  useDeleteAdminShippingRate,
  useUpdateAdminShippingZone,
} from './_hooks'
import RateDialog from './_rate_dialog'
import RegionPicker from './_region_picker'
import {
  AdminShippingZoneFormSchema,
  type AdminShippingRate,
  type AdminShippingZoneDetail,
} from './_types'

type RateDialogState = { open: false } | { open: true; rate: AdminShippingRate | null }

/** One line per condition set on the rate; empty means every cart. */
function rateConditions(
  rate: AdminShippingRate,
  primaryMarket: PricingMarket | null | undefined,
  markets: PricingMarket[],
  weightUnit: string
): string[] {
  const subtotal = (min: number | null, max: number | null, currencyCode?: string) =>
    formatSubtotalRange({ min, max }, currencyCode)
  const lines = [
    subtotal(rate.minSubtotal, rate.maxSubtotal, primaryMarket?.currencyCode),
    ...markets.map((market) => {
      const entry = rate.marketPrices.find(({ marketId }) => marketId === market.id)
      return entry ? subtotal(entry.minSubtotal, entry.maxSubtotal, market.currencyCode) : null
    }),
    formatWeightRange({ min: rate.minWeight, max: rate.maxWeight }, weightUnit),
    formatItemRange({ min: rate.minItems, max: rate.maxItems }),
  ]
  return lines.filter((line): line is string => line !== null)
}

function formatRatePrice(price: number, currencyCode: string | undefined) {
  if (price === 0) return 'Free'
  return currencyCode ? `${currencyCode} ${formatPrice(price)}` : formatPrice(price)
}

function rateColumns(
  primaryMarket: PricingMarket | null | undefined,
  markets: PricingMarket[],
  weightUnit: string
): DataTableColumn<AdminShippingRate>[] {
  return [
    {
      key: 'name',
      header: 'Rate',
      cell: (rate) => (
        <div className="min-w-0 max-w-[320px]">
          <span className="text-[13.5px] font-medium text-ink">{rate.name}</span>
          {rate.description && (
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">{rate.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'conditions',
      header: 'Offered for',
      cell: (rate) => {
        const conditions = rateConditions(rate, primaryMarket, markets, weightUnit)
        if (conditions.length === 0) return 'Every cart'
        return (
          <ul className="flex flex-col gap-0.5">
            {conditions.map((condition) => (
              <li key={condition} className="text-[13px] whitespace-nowrap">
                {condition}
              </li>
            ))}
          </ul>
        )
      },
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      cell: (rate) => (
        <div className="flex flex-col items-end">
          <span className={dataTable.mono}>
            {formatRatePrice(rate.price, primaryMarket?.currencyCode)}
          </span>
          {markets.flatMap((market) => {
            const entry = rate.marketPrices.find(({ marketId }) => marketId === market.id)
            return entry
              ? [
                  <span key={market.id} className={`${dataTable.mono} text-[12px] text-muted`}>
                    {formatRatePrice(entry.price, market.currencyCode)}
                  </span>,
                ]
              : []
          })}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (rate) =>
        rate.isActive ? (
          <Badge tone="success" dot>
            Offered
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            Hidden
          </Badge>
        ),
    },
  ]
}

export default function AdminShippingEdit({ id }: { id: string }) {
  const { data: zone, isLoading, isError, refetch } = useAdminShippingZone(id)

  return (
    <Page
      eyebrow={
        <Link route="admin.shipping.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Shipping
        </Link>
      }
      title={zone?.name ?? 'Shipping zone'}
      description="Choose where this zone ships and the rates customers there can pick."
    >
      {isLoading ? (
        <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !zone ? (
        <div className={`${card.base} py-12 text-center text-[14px] text-muted`}>
          Could not load this shipping zone.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {!zone.isActive && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This zone is archived. Restore it from the list before editing it.
            </p>
          )}
          <ZoneForm key={zone.id} zone={zone} />
          <RatesCard zone={zone} />
        </div>
      )}
    </Page>
  )
}

function ZoneForm({ zone }: { zone: AdminShippingZoneDetail }) {
  const [name, setName] = useState(zone.name)
  const [countryCodes, setCountryCodes] = useState(zone.countryCodes)
  const [regionCodes, setRegionCodes] = useState(zone.regionCodes)
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateZone = useUpdateAdminShippingZone()
  const { data: marketCountryCodes } = useAdminShippingMarketCountries()
  const examples = shippingExamplesFor(useOperatingCountry())
  const disabled = !zone.isActive

  const unsold = marketCountryCodes
    ? [...new Set([...countryCodes, ...regionCodes.map(regionCountryCode)])].filter(
        (code) => !marketCountryCodes.includes(code)
      )
    : []

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminShippingZoneFormSchema.safeParse({ name, countryCodes, regionCodes })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateZone.mutate(
      { id: zone.id, ...parsed.data },
      {
        onSuccess: (saved) => toast.success(`${saved.name} saved`),
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <section className={panel}>
        <Section title="Details">
          <FormInput
            name="name"
            label="Zone name"
            autoComplete="off"
            value={name}
            disabled={disabled}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />
        </Section>
      </section>

      <section className={panel}>
        <Section
          title="Destinations"
          description="Where this zone ships. The destinations you pick decide coverage; the zone name is only a label."
        >
          <div className="flex flex-col gap-6">
            {unsold.length > 0 && (
              <p className="rounded-card border border-line-2 bg-paper px-4 py-3 text-[13px] text-muted">
                {unsold.map(countryName).join(', ')} {unsold.length === 1 ? 'isn’t' : 'aren’t'} in
                an active market, so customers there can’t order yet. Add{' '}
                {unsold.length === 1 ? 'it' : 'them'} to a market under Markets.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center gap-1">
                <h3 className="text-[13.5px] font-medium text-ink">Whole countries</h3>
                <InfoTooltip label="About whole countries">
                  A country can belong to only one zone. Provinces assigned to another zone use that
                  zone’s rates instead.
                </InfoTooltip>
              </div>
              <FormMultiSelect
                name="countryCodes"
                label="Add a country"
                placeholder="Search countries…"
                emptyText="No whole countries in this zone."
                options={COUNTRY_OPTIONS}
                values={countryCodes}
                disabled={disabled}
                onChange={setCountryCodes}
                error={errors.countryCodes}
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-line pt-6">
              <div className="relative flex items-center gap-1">
                <h3 className="text-[13.5px] font-medium text-ink">Provinces and regions</h3>
                <InfoTooltip label="About provinces and regions">
                  Charge a different price for part of a country, e.g. {examples.regionGroups}. A
                  province can belong to only one zone.
                </InfoTooltip>
              </div>
              <RegionPicker
                zoneId={zone.id}
                values={regionCodes}
                disabled={disabled}
                onChange={setRegionCodes}
                error={errors.regionCodes}
              />
            </div>
          </div>
        </Section>
        {!disabled && (
          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <FormButton loading={updateZone.isPending}>Save zone</FormButton>
          </div>
        )}
      </section>
    </form>
  )
}

function RatesCard({ zone }: { zone: AdminShippingZoneDetail }) {
  const [dialog, setDialog] = useState<RateDialogState>({ open: false })
  const [rateToDelete, setRateToDelete] = useState<AdminShippingRate | null>(null)
  const deleteRate = useDeleteAdminShippingRate(zone.id)
  const { data: markets = [] } = usePricingMarkets(SHIPPING_MARKETS_URL)
  const { data: primaryMarket } = usePrimaryPricingMarket(SHIPPING_MARKETS_URL)
  const weightUnit = useWeightUnit()
  const editable = zone.isActive

  function onConfirmDelete() {
    if (!rateToDelete) return
    const target = rateToDelete
    deleteRate.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted`)
        setRateToDelete(null)
      },
      onError: (error) => {
        toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
      },
    })
  }

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div className="min-w-0">
          <h2 className={card.title}>Rates</h2>
          <p className="mt-0.5 text-[13.5px] text-muted">
            Customers in this zone choose from the rates that match their cart. A rate priced at 0
            is free shipping.
          </p>
        </div>
        {editable && (
          <FormButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setDialog({ open: true, rate: null })}
          >
            <Plus size={15} /> Add rate
          </FormButton>
        )}
      </header>

      <DataTable
        label="Shipping rates"
        rows={zone.rates}
        columns={rateColumns(primaryMarket, markets, weightUnit)}
        getRowId={(rate) => rate.id}
        rowActions={
          editable
            ? (rate) => (
                <>
                  <IconButton
                    label={`Edit ${rate.name}`}
                    size="sm"
                    onClick={() => setDialog({ open: true, rate })}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton
                    label={`Delete ${rate.name}`}
                    size="sm"
                    onClick={() => setRateToDelete(rate)}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </>
              )
            : undefined
        }
        emptySlot="No rates yet. Customers in this zone can't be shipped to until you add one."
      />

      {dialog.open && (
        <RateDialog
          key={dialog.rate?.id ?? 'new'}
          open
          zoneId={zone.id}
          rate={dialog.rate}
          onClose={() => setDialog({ open: false })}
        />
      )}

      <Dialog
        open={rateToDelete !== null}
        onClose={() => setRateToDelete(null)}
        title="Delete rate?"
        description={
          rateToDelete ? (
            <>
              Delete <strong className="font-medium text-ink">{rateToDelete.name}</strong>?
              Customers will no longer be able to choose it.
            </>
          ) : null
        }
      >
        <form
          className="flex flex-wrap justify-end gap-2.5"
          onSubmit={(event) => {
            event.preventDefault()
            onConfirmDelete()
          }}
        >
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setRateToDelete(null)}
          >
            Cancel
          </FormButton>
          <FormButton type="submit" variant="danger" size="sm" loading={deleteRate.isPending}>
            Delete rate
          </FormButton>
        </form>
      </Dialog>
    </section>
  )
}

AdminShippingEdit.layout = [AdminLayout]
