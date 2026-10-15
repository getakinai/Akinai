import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { Archive, ArchiveRestore, ArrowLeft, LogIn } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Skeleton, TabPanel, Tabs, type TabItem } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import EmailsCard from '../emails/_emails_card'
import CustomerActivityCard from './_activity_card'
import AccountCard from './_account_card'
import AddressesCard from './_addresses_card'
import { accountStateMeta, customerDisplayName } from './_format'
import { useAdminCustomer, useArchiveAdminCustomer, useUnarchiveAdminCustomer } from './_hooks'
import ImpersonateDialog from './_impersonate_dialog'
import MarketingCard from './_marketing_card'
import NotesCard from './_notes_card'
import OrdersCard from './_orders_card'
import OverviewCard from './_overview_card'

type CustomerTab = 'overview' | 'addresses' | 'orders' | 'emails' | 'activity'

const CUSTOMER_TABS: TabItem<CustomerTab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'orders', label: 'Orders' },
  { id: 'emails', label: 'Emails' },
  { id: 'activity', label: 'Activity' },
]

function EditSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading customer">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className={`${card.base} flex flex-col gap-3`}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export default function AdminCustomersEdit({ id }: { id: string }) {
  const { data: customer, isLoading, isError, refetch } = useAdminCustomer(id)
  const archive = useArchiveAdminCustomer()
  const unarchive = useUnarchiveAdminCustomer()
  const canEdit = useCan('customers.edit')
  const canArchive = useCan('customers.archive')

  const [impersonateOpen, setImpersonateOpen] = useState(false)
  const [tab, setTab] = useState<CustomerTab>('overview')

  const isArchived = customer ? !customer.isActive : false
  const editable = canEdit && !isArchived
  const canImpersonate = Boolean(customer?.account) && !isArchived

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive() {
    if (!customer) return
    if (isArchived) {
      unarchive.mutate(customer.id, {
        onSuccess: (saved) => toast.success(`${customerDisplayName(saved)} restored`),
        onError,
      })
    } else {
      archive.mutate(customer.id, {
        onSuccess: (saved) => toast.success(`${customerDisplayName(saved)} archived`),
        onError,
      })
    }
  }

  const accountMeta = customer ? accountStateMeta[customer.accountState] : null

  return (
    <Page
      eyebrow={
        <Link
          route="admin.customers.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Customers
        </Link>
      }
      title={customer ? customerDisplayName(customer) : 'Customer'}
      description={
        customer &&
        accountMeta && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={accountMeta.tone} dot>
              {accountMeta.label}
            </Badge>
            {isArchived && <Badge tone="warning">Archived</Badge>}
          </span>
        )
      }
      actions={
        customer &&
        (canImpersonate || canArchive) && (
          <div className="flex flex-wrap items-center gap-2">
            {canImpersonate && (
              <FormButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setImpersonateOpen(true)}
              >
                <LogIn size={15} /> Impersonate
              </FormButton>
            )}
            {canArchive && (
              <FormButton
                type="button"
                variant="secondary"
                size="sm"
                loading={archive.isPending || unarchive.isPending}
                onClick={onToggleArchive}
              >
                {isArchived ? (
                  <>
                    <ArchiveRestore size={15} /> Unarchive
                  </>
                ) : (
                  <>
                    <Archive size={15} /> Archive
                  </>
                )}
              </FormButton>
            )}
          </div>
        )
      }
    >
      {isLoading ? (
        <EditSkeleton />
      ) : isError || !customer ? (
        <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
          <span className="text-[14px] text-muted">Could not load this customer.</span>
          <div className="flex gap-2.5">
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
            <Link
              route="admin.customers.home"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Back to customers
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {isArchived && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This customer is archived and can&apos;t sign in to the storefront. Unarchive them to
              make changes.
            </p>
          )}
          <Tabs
            idPrefix="customer"
            label="Customer sections"
            value={tab}
            onChange={setTab}
            tabs={CUSTOMER_TABS}
          />
          <TabPanel idPrefix="customer" id="overview" active={tab === 'overview'}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <OverviewCard
                key={`${customer.id}-${customer.updatedAt ?? ''}`}
                customer={customer}
                editable={editable}
              />
              <AccountCard customer={customer} />
              <MarketingCard customer={customer} editable={editable} />
              <NotesCard
                key={`${customer.id}-notes-${customer.updatedAt ?? ''}`}
                customer={customer}
                editable={editable}
              />
            </div>
          </TabPanel>
          <TabPanel idPrefix="customer" id="addresses" active={tab === 'addresses'}>
            <AddressesCard customer={customer} editable={editable} />
          </TabPanel>
          <TabPanel idPrefix="customer" id="orders" active={tab === 'orders'}>
            {tab === 'orders' && <OrdersCard customerId={customer.id} />}
          </TabPanel>
          <TabPanel idPrefix="customer" id="emails" active={tab === 'emails'}>
            {tab === 'emails' && <EmailsCard customerId={customer.id} />}
          </TabPanel>
          <TabPanel idPrefix="customer" id="activity" active={tab === 'activity'}>
            {tab === 'activity' && <CustomerActivityCard customerId={customer.id} />}
          </TabPanel>
          {canImpersonate && (
            <ImpersonateDialog
              key={impersonateOpen ? 'open' : 'closed'}
              open={impersonateOpen}
              customer={customer}
              onClose={() => setImpersonateOpen(false)}
            />
          )}
        </div>
      )}
    </Page>
  )
}

AdminCustomersEdit.layout = [AdminLayout]
