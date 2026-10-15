import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { Eye, Plus } from 'lucide-react'
import Page from '~/components/page'
import {
  BulkArchiveActions,
  InfiniteDataTable,
  DataTableBulkBar,
  DataTableToolbar,
  type DataTableColumn,
} from '~/components/data_table'
import { FormSelectWithSearch } from '~/components/form'
import { Badge, IconButton, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useDateFormat } from '~/hooks/use_date_format'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, dataTable, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import { customerDisplayName } from '../customers/_format'
import {
  formatMoney,
  fulfillmentStatusMeta,
  orderLabel,
  PAYMENT_FILTER_OPTIONS,
  paymentStatusMeta,
} from './_format'
import { useAdminOrdersInfinite, useBulkSetAdminOrdersArchived } from './_hooks'
import {
  AdminOrderArchiveFilterSchema,
  AdminOrderFulfillmentFilterSchema,
  AdminOrderPaymentFilterSchema,
  ORDER_FULFILLMENT_STATUSES,
  type AdminOrderArchiveFilter,
  type AdminOrderFulfillmentFilter,
  type AdminOrderListItem,
  type AdminOrderPaymentFilter,
  type AdminOrdersSortKey,
} from './_types'

function buildOrderColumns(
  formatOrderDate: (value: string | null) => string
): DataTableColumn<AdminOrderListItem, AdminOrdersSortKey>[] {
  return [
    {
      key: 'number',
      header: 'Order',
      sortKey: 'number',
      cell: (order) => (
        <span className="flex flex-col">
          <span className="flex items-center gap-1.5 font-medium text-ink">
            {orderLabel(order)}
            {order.archivedAt && <Badge tone="neutral">Archived</Badge>}
          </span>
          {order.bankReference && <span className={dataTable.mono}>{order.bankReference}</span>}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortKey: 'createdAt',
      cell: (order) => (
        <span className={dataTable.mono}>
          {formatOrderDate(order.completedAt ?? order.createdAt)}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (order) =>
        order.customer ? (
          <span className="block max-w-[160px] truncate sm:max-w-[240px]">
            {customerDisplayName(order.customer)}
          </span>
        ) : (
          <span className="text-muted">No customer</span>
        ),
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: (order) => {
        if (!order.paymentStatus) return null
        const meta = paymentStatusMeta[order.paymentStatus]
        return (
          <span className="inline-flex flex-wrap gap-1.5">
            {order.status === 'cancelled' && <Badge tone="danger">Cancelled</Badge>}
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </span>
        )
      },
    },
    {
      key: 'fulfillment',
      header: 'Fulfillment',
      cell: (order) => {
        const meta = fulfillmentStatusMeta[order.fulfillmentStatus]
        return (
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
        )
      },
    },
    {
      key: 'total',
      header: 'Total',
      sortKey: 'total',
      align: 'right',
      cell: (order) => formatMoney(order.total, order.currencyCode),
    },
  ]
}

type AdminOrdersHomeProps = {
  paymentStatus?: string
  fulfillmentStatus?: string
}

export default function AdminOrdersHome(props: AdminOrdersHomeProps) {
  const { formatOrderDate } = useDateFormat()
  const columns = useMemo(() => buildOrderColumns(formatOrderDate), [formatOrderDate])
  const { query, sort, setSearch, setSort } = useListQueryState<AdminOrdersSortKey>({
    defaultSort: { key: 'number', direction: 'desc' },
  })
  const [paymentStatus, setPaymentStatus] = useState<AdminOrderPaymentFilter>(() =>
    AdminOrderPaymentFilterSchema.catch('').parse(props.paymentStatus)
  )
  const [fulfillmentStatus, setFulfillmentStatus] = useState<AdminOrderFulfillmentFilter>(() =>
    AdminOrderFulfillmentFilterSchema.catch('').parse(props.fulfillmentStatus)
  )
  const [archive, setArchive] = useState<AdminOrderArchiveFilter>('active')
  const list = useAdminOrdersInfinite({
    ...query,
    paymentStatus,
    fulfillmentStatus,
    archive,
  })
  const canCreate = useCan('orders.create')
  const canArchive = useCan('orders.archive')
  const selection = useBulkSelection(['order', 'orders'])
  const bulkArchive = useBulkSetAdminOrdersArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany
  const filtered = Boolean(query.q || paymentStatus || fulfillmentStatus || archive !== 'active')

  const onFilterChange = () => {
    selection.clear()
  }

  return (
    <Page
      eyebrow="Back office · Orders"
      title="Orders"
      description="Completed orders. Orders created in the back office start as drafts."
      actions={
        canCreate && (
          <Link route="admin.orders.drafts.create" className={buttonClasses({ size: 'sm' })}>
            <Plus size={15} /> Create order
          </Link>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search orders"
              placeholder="Search by number, bank reference, customer or email…"
              value={query.q}
              onDebouncedChange={(next) => {
                setSearch(next)
                selection.clear()
              }}
              className={listToolbarSearch}
            />
          }
          right={
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <FormSelectWithSearch
                name="orders-payment-filter"
                label="Filter by payment"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={paymentStatus}
                onChange={(next) => {
                  setPaymentStatus(AdminOrderPaymentFilterSchema.parse(next))
                  onFilterChange()
                }}
                options={PAYMENT_FILTER_OPTIONS}
              />
              <FormSelectWithSearch
                name="orders-fulfillment-filter"
                label="Filter by fulfillment"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={fulfillmentStatus}
                onChange={(next) => {
                  setFulfillmentStatus(AdminOrderFulfillmentFilterSchema.parse(next))
                  onFilterChange()
                }}
                options={[
                  { value: '', label: 'All fulfillment' },
                  ...ORDER_FULFILLMENT_STATUSES.map((status) => ({
                    value: status,
                    label: fulfillmentStatusMeta[status].label,
                  })),
                ]}
              />
              <FormSelectWithSearch
                name="orders-archive-filter"
                label="Filter by archive state"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={archive}
                onChange={(next) => {
                  setArchive(AdminOrderArchiveFilterSchema.parse(next))
                  onFilterChange()
                }}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                  { value: 'all', label: 'All orders' },
                ]}
              />
            </div>
          }
        />

        {canArchive && (
          <DataTableBulkBar
            selectedCount={selection.selectedIds.length}
            onClear={selection.clear}
            noun={selection.noun}
          >
            <BulkArchiveActions
              disabled={bulkDisabled}
              onArchive={() =>
                bulkArchive.mutate(
                  { ids: selection.selectedIds, archived: true },
                  selection.feedback('archived')
                )
              }
              onUnarchive={() =>
                bulkArchive.mutate(
                  { ids: selection.selectedIds, archived: false },
                  selection.feedback('unarchived')
                )
              }
            />
          </DataTableBulkBar>
        )}

        <InfiniteDataTable
          selectedIds={canArchive ? selection.selectedIds : undefined}
          onSelectionChange={canArchive ? selection.setSelectedIds : undefined}
          label="Orders"
          list={list}
          columns={columns}
          getRowId={(order) => order.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={(order) => (
            <IconButton
              label={`View order ${orderLabel(order)}`}
              size="sm"
              onClick={() => router.visit(`/admin/orders/show/${order.id}`)}
            >
              <Eye size={15} />
            </IconButton>
          )}
          emptySlot={filtered ? 'No orders match your filters.' : 'No orders yet.'}
          errorMessage="Could not load orders."
        />
      </section>
    </Page>
  )
}

AdminOrdersHome.layout = [AdminLayout]
