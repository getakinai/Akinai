import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import Section from '~/components/section'
import {
  FormButton,
  FormSwitch,
  FormInput,
  FormMultiSelect,
  FormSelectWithSearch,
} from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { COUNTRY_OPTIONS } from '~/lib/countries'
import { CURRENCY_OPTIONS } from '~/lib/currencies'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card, panel } from '~/lib/styles'
import { useAdminMarket, useUpdateAdminMarket } from './_hooks'
import { AdminMarketUpdateFormSchema, type AdminMarket } from './_types'

export default function AdminMarketsEdit({ id }: { id: string }) {
  const { data: market, isLoading, isError, refetch } = useAdminMarket(id)

  return (
    <Page
      eyebrow={
        <Link route="admin.markets.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Markets
        </Link>
      }
      title={market?.name ?? 'Market'}
      description="Set the currency and the countries this market covers."
      actions={market?.isPrimary && <Badge tone="info">Primary market</Badge>}
    >
      {isLoading ? (
        <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !market ? (
        <div className={`${card.base} py-12 text-center text-[14px] text-muted`}>
          Could not load this market.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <MarketForm key={market.id} market={market} />
      )}
    </Page>
  )
}

function MarketForm({ market }: { market: AdminMarket }) {
  const [name, setName] = useState(market.name)
  const [handle, setHandle] = useState(market.handle)
  const [currencyCode, setCurrencyCode] = useState(market.currencyCode)
  const [pricesIncludeTax, setPricesIncludeTax] = useState(market.pricesIncludeTax)
  const [countryCodes, setCountryCodes] = useState(market.countryCodes ?? [])
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateMarket = useUpdateAdminMarket()
  const disabled = !market.isActive

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminMarketUpdateFormSchema.safeParse({
      name,
      handle,
      currencyCode,
      pricesIncludeTax,
      countryCodes,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateMarket.mutate(
      { id: market.id, ...parsed.data },
      {
        onSuccess: (saved) => toast.success(`${saved.name} saved`),
        onError: (error) => handleMutationError(error, setErrors),
      }
    )
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {disabled && (
        <p className={`${card.base} text-[13.5px] text-muted`}>
          This market is archived. Restore it from the list before editing it.
        </p>
      )}

      <section className={panel}>
        <Section title="Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="name"
              label="Name"
              autoComplete="off"
              value={name}
              disabled={disabled}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
            />
            <FormInput
              name="handle"
              label="Handle"
              autoComplete="off"
              value={handle}
              disabled={disabled}
              onChange={(event) => setHandle(event.target.value)}
              error={errors.handle}
            />
          </div>
          <FormSelectWithSearch
            name="currencyCode"
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={currencyCode}
            disabled={disabled}
            onChange={setCurrencyCode}
            error={errors.currencyCode}
          />
          <FormSwitch
            name="pricesIncludeTax"
            label="Prices include tax"
            checked={pricesIncludeTax}
            disabled={disabled}
            onChange={(event) => setPricesIncludeTax(event.target.checked)}
            error={errors.pricesIncludeTax}
          />
        </Section>
      </section>

      <section className={panel}>
        <Section
          title="Countries"
          description={
            market.isPrimary
              ? 'Countries no other market covers also use the primary market.'
              : 'A country can belong to only one market.'
          }
        >
          <FormMultiSelect
            name="countryCodes"
            label="Add a country"
            placeholder="Search countries…"
            emptyText="No countries in this market yet."
            options={COUNTRY_OPTIONS}
            values={countryCodes}
            disabled={disabled}
            onChange={setCountryCodes}
            error={errors.countryCodes}
          />
        </Section>
      </section>

      {!disabled && (
        <div className="flex flex-wrap justify-end gap-2.5">
          <FormButton loading={updateMarket.isPending}>Save market</FormButton>
        </div>
      )}
    </form>
  )
}

AdminMarketsEdit.layout = [AdminLayout]
