import { useState } from 'react'
import { Building2, CreditCard, Landmark, Wallet, type LucideIcon } from 'lucide-react'
import { DataTableToolbar } from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import Page from '~/components/page'
import { Badge, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import BankTransferDialog from './_bank_transfer_dialog'
import {
  useAdminBankTransfer,
  useAdminPaymentMarkets,
  useAdminPaymentMethods,
  useAdminPoli,
  useAdminStripe,
} from './_hooks'
import PoliDialog from './_poli_dialog'
import StripeDialog from './_stripe_dialog'
import { STRIPE_MODE_LABELS, type AdminPaymentMethod } from './_types'

const rowsCard = 'overflow-hidden rounded-card border border-line-2 bg-card divide-y divide-line'

const REGION_LABELS = { NZ: 'NZ', AU: 'AU' } as const

const METHOD_ICONS: Record<string, LucideIcon> = {
  bank_transfer: Landmark,
  stripe: CreditCard,
  poli: Building2,
}

const MANAGED_CODES = ['bank_transfer', 'stripe', 'poli'] as const

type ManagedCode = (typeof MANAGED_CODES)[number]

const isManaged = (code: string): code is ManagedCode =>
  MANAGED_CODES.some((managed) => managed === code)

function StatusBadge({ method }: { method: AdminPaymentMethod }) {
  if (method.status === 'coming_soon') return <Badge>Coming soon</Badge>
  if (!method.configured) return <Badge tone="warning">Not set up</Badge>
  return method.isEnabled ? (
    <Badge tone="success" dot>
      Active
    </Badge>
  ) : (
    <Badge>Off</Badge>
  )
}

function AvailabilityBadges({ method }: { method: AdminPaymentMethod }) {
  if (method.status === 'coming_soon') {
    return method.regions.map((region) => <Badge key={region}>{REGION_LABELS[region]}</Badge>)
  }
  if (method.markets.length === 0) return method.configured ? <Badge>No markets</Badge> : null
  return method.markets.map((market) => (
    <Badge key={market.id} tone="info">
      {market.name}
    </Badge>
  ))
}

function PaymentRow({ method, onManage }: { method: AdminPaymentMethod; onManage?: () => void }) {
  const Icon = METHOD_ICONS[method.code] ?? Wallet
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3 px-4 py-3.5">
      <span className="grid size-8 shrink-0 place-items-center text-ink-2">
        <Icon size={18} />
      </span>
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-medium text-ink">{method.name}</span>
          <StatusBadge method={method} />
          {method.configured && method.mode && (
            <Badge tone={method.mode === 'live' ? 'success' : 'warning'}>
              {STRIPE_MODE_LABELS[method.mode]}
            </Badge>
          )}
        </div>
        <p className="text-[13.5px] break-words text-muted">{method.description}</p>
        <div className="flex flex-wrap gap-1.5">
          <AvailabilityBadges method={method} />
        </div>
      </div>
      {onManage && (
        <FormButton type="button" variant="secondary" size="sm" onClick={onManage}>
          {method.configured ? 'Manage' : 'Set up'}
        </FormButton>
      )}
    </div>
  )
}

export default function AdminPaymentsHome() {
  const { data: methods, isLoading, isError, refetch } = useAdminPaymentMethods()
  const markets = useAdminPaymentMarkets()
  const canEdit = useCan('payments.edit')
  const [marketFilter, setMarketFilter] = useState('')
  const [openDialog, setOpenDialog] = useState<ManagedCode | null>(null)
  const bankTransfer = useAdminBankTransfer(canEdit)
  const stripe = useAdminStripe(canEdit)
  const poli = useAdminPoli(canEdit)
  const close = () => setOpenDialog(null)
  const manage = (code: string) =>
    canEdit && isManaged(code) ? () => setOpenDialog(code) : undefined

  const filterMarket = markets.data?.find((market) => market.id === marketFilter)
  const visible = filterMarket
    ? (methods ?? []).filter((method) =>
        method.markets.some((market) => market.id === filterMarket.id)
      )
    : (methods ?? [])

  return (
    <Page title="Payments" description="Payment methods offered to customers in each market.">
      <div className="flex w-full min-w-0 flex-col gap-3">
        <DataTableToolbar
          right={
            <FormSelectWithSearch
              name="payments-market-filter"
              label="Filter by market"
              hideLabel
              compact
              className="w-full min-w-[12rem] sm:w-auto"
              disabled={!markets.data}
              value={marketFilter}
              onChange={setMarketFilter}
              options={[
                { value: '', label: 'All markets' },
                ...(markets.data ?? []).map((market) => ({
                  value: market.id,
                  label: `${market.name} (${market.currencyCode})`,
                })),
              ]}
            />
          }
        />
        {isLoading ? (
          <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : isError || !methods ? (
          <div className={`${card.base} py-12 text-center text-[14px] text-muted`}>
            Could not load payment methods.{' '}
            <button type="button" className="underline" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className={`${card.base} py-12 text-center text-[14px] text-muted`}>
            No payment methods are offered in {filterMarket?.name ?? 'this market'} yet.
          </div>
        ) : (
          <div className={rowsCard}>
            {visible.map((method) => (
              <PaymentRow key={method.code} method={method} onManage={manage(method.code)} />
            ))}
          </div>
        )}
      </div>

      {openDialog === 'bank_transfer' && bankTransfer.data && (
        <BankTransferDialog
          open
          setup={bankTransfer.data}
          initialMarketId={filterMarket?.id ?? null}
          onClose={close}
        />
      )}
      {openDialog === 'stripe' && stripe.data && markets.data && (
        <StripeDialog open setup={stripe.data} markets={markets.data} onClose={close} />
      )}
      {openDialog === 'poli' && poli.data && markets.data && (
        <PoliDialog open setup={poli.data} markets={markets.data} onClose={close} />
      )}
    </Page>
  )
}

AdminPaymentsHome.layout = [AdminLayout]
