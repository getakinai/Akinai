import { useMemo, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Eye } from 'lucide-react'
import Page from '~/components/page'
import { InfiniteDataTable, DataTableToolbar, type DataTableColumn } from '~/components/data_table'
import { FormSelectWithSearch } from '~/components/form'
import { Badge, SearchInput } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import AdminLayout from '~/layouts/admin'
import { returnStatusMeta } from '~/lib/returns'
import { card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { customerDisplayName } from '../customers/_format'
import { useAdminReturnsInfinite } from './_hooks'
import {
  RETURN_STATUSES,
  ReturnStatusFilterSchema,
  type AdminReturnListItem,
  type ReturnStatusFilter,
} from './_types'

type AdminReturnsHomeProps = {
  status: string
}

function buildReturnColumns(
  formatOrderDate: (value: string | null) => string
): DataTableColumn<AdminReturnListItem>[] {
  return [
    {
      key: 'return',
      header: 'Return',
      cell: (ret) => (
        <div className="min-w-0">
          <Link
            route="admin.orders.show"
            routeParams={{ id: ret.orderId }}
            className="text-[13.5px] font-medium text-ink hover:underline"
          >
            {ret.order?.label ?? 'Order'} · Return {ret.number}
          </Link>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (ret) => (
        <span className="truncate text-[13px]">
          {ret.customer ? customerDisplayName(ret.customer) : (ret.order?.email ?? 'Guest')}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (ret) => <span className={dataTable.mono}>{ret.itemCount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (ret) => {
        const meta = returnStatusMeta[ret.status]
        return (
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
        )
      },
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      cell: (ret) => (
        <span className={`${dataTable.mono} whitespace-nowrap`}>
          {formatOrderDate(ret.requestedAt)}
        </span>
      ),
    },
  ]
}

export default function AdminReturnsHome(props: AdminReturnsHomeProps) {
  const { formatOrderDate } = useDateFormat()
  const columns = useMemo(() => buildReturnColumns(formatOrderDate), [formatOrderDate])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ReturnStatusFilter>(() =>
    ReturnStatusFilterSchema.catch('').parse(props.status)
  )
  const list = useAdminReturnsInfinite({ q, status })
  const filtered = Boolean(q || status)

  return (
    <Page
      eyebrow="Back office · Orders"
      title="Returns"
      description="Return requests from customers and returns you created. Open the order to approve, receive and refund them."
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search returns"
              placeholder="Search by order number or email…"
              value={q}
              onDebouncedChange={setQ}
              className={listToolbarSearch}
            />
          }
          right={
            <FormSelectWithSearch
              name="returns-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => setStatus(ReturnStatusFilterSchema.parse(next))}
              options={[
                { value: '', label: 'All status' },
                ...RETURN_STATUSES.map((value) => ({
                  value,
                  label: returnStatusMeta[value].label,
                })),
              ]}
            />
          }
        />

        <InfiniteDataTable
          label="Returns"
          list={list}
          columns={columns}
          getRowId={(ret) => ret.id}
          rowActions={(ret) => (
            <Link
              route="admin.orders.show"
              routeParams={{ id: ret.orderId }}
              className={`${iconButton} size-7 border-transparent`}
              aria-label={`Open the order for return ${ret.number}`}
              title="Open order"
            >
              <Eye size={15} />
            </Link>
          )}
          emptySlot={filtered ? 'No returns match your filters.' : 'No returns yet.'}
          errorMessage="Could not load returns."
        />
      </section>
    </Page>
  )
}

AdminReturnsHome.layout = [AdminLayout]
