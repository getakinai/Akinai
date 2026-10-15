import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { Pencil, Plus } from 'lucide-react'
import Page from '~/components/page'
import { InfiniteDataTable, DataTableToolbar, type DataTableColumn } from '~/components/data_table'
import { IconButton, SearchInput } from '~/components/ui'
import { useMemo } from 'react'
import { useDateFormat } from '~/hooks/use_date_format'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, dataTable, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../../_hooks'
import { customerDisplayName } from '../../customers/_format'
import { draftLabel, formatMoney } from '../_format'
import { useAdminDraftOrdersInfinite } from '../_hooks'
import { type AdminOrderListItem, type AdminOrdersSortKey } from '../_types'

function buildDraftColumns(
  formatOrderDate: (value: string | null) => string
): DataTableColumn<AdminOrderListItem, AdminOrdersSortKey>[] {
  return [
    {
      key: 'number',
      header: 'Draft',
      sortKey: 'number',
      cell: (draft) => (
        <span className="font-medium text-ink">{draftLabel(draft.draftNumber)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortKey: 'createdAt',
      cell: (draft) => <span className={dataTable.mono}>{formatOrderDate(draft.createdAt)}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (draft) =>
        draft.customer ? (
          <span className="truncate">{customerDisplayName(draft.customer)}</span>
        ) : (
          <span className="text-muted">No customer</span>
        ),
    },
    {
      key: 'total',
      header: 'Total',
      sortKey: 'total',
      align: 'right',
      cell: (draft) => formatMoney(draft.total, draft.currencyCode),
    },
  ]
}

export default function AdminDraftOrdersHome() {
  const { formatOrderDate } = useDateFormat()
  const columns = useMemo(() => buildDraftColumns(formatOrderDate), [formatOrderDate])
  const { query, sort, setSearch, setSort } = useListQueryState<AdminOrdersSortKey>({
    defaultSort: { key: 'createdAt', direction: 'desc' },
  })
  const list = useAdminDraftOrdersInfinite(query)
  const canCreate = useCan('orders.create')
  const canEdit = useCan('orders.edit')

  return (
    <Page
      eyebrow="Back office · Orders"
      title="Drafts"
      description="Orders you are building for customers. Complete a draft to turn it into an order."
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
              label="Search drafts"
              placeholder="Search by number, customer or email…"
              value={query.q}
              onDebouncedChange={setSearch}
              className={listToolbarSearch}
            />
          }
        />

        <InfiniteDataTable
          label="Draft orders"
          list={list}
          columns={columns}
          getRowId={(draft) => draft.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit
              ? (draft) => (
                  <IconButton
                    label={`Edit draft ${draftLabel(draft.draftNumber)}`}
                    size="sm"
                    onClick={() => router.visit(`/admin/orders/drafts/edit/${draft.id}`)}
                  >
                    <Pencil size={15} />
                  </IconButton>
                )
              : undefined
          }
          emptySlot={query.q ? 'No drafts match your search.' : 'No draft orders yet.'}
          errorMessage="Could not load drafts."
        />
      </section>
    </Page>
  )
}

AdminDraftOrdersHome.layout = [AdminLayout]
