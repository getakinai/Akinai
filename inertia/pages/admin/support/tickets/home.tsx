import { useMemo, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { CircleCheck, Eye, RotateCcw } from 'lucide-react'
import Page from '~/components/page'
import {
  DataTableBulkBar,
  DataTableToolbar,
  InfiniteDataTable,
  type DataTableColumn,
} from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { Badge, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useDateFormat } from '~/hooks/use_date_format'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { useCan } from '~/pages/admin/_hooks'
import { supportStatusMeta } from './_format'
import { useAdminSupportTicketsInfinite, useBulkSetAdminSupportTicketsStatus } from './_hooks'
import {
  SUPPORT_TICKET_STATUSES,
  SupportTicketAssignedFilterSchema,
  SupportTicketStatusFilterSchema,
  type AdminSupportTicket,
  type AdminSupportTicketsSortKey,
  type SupportTicketAssignedFilter,
  type SupportTicketStatusFilter,
} from './_types'

export default function AdminSupportTicketsHome() {
  const { formatDateTime } = useDateFormat()
  const { query, sort, setSearch, setSort } = useListQueryState<AdminSupportTicketsSortKey>({
    defaultSort: { key: 'lastMessageAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<SupportTicketStatusFilter>('')
  const [assigned, setAssigned] = useState<SupportTicketAssignedFilter>('')
  const list = useAdminSupportTicketsInfinite({ ...query, status, assigned })
  const filtered = Boolean(query.q || status || assigned)
  const canEdit = useCan('support_tickets.edit')
  const selection = useBulkSelection(['request', 'requests'])
  const bulkStatus = useBulkSetAdminSupportTicketsStatus()
  const bulkDisabled = bulkStatus.isPending || selection.tooMany

  const columns = useMemo<DataTableColumn<AdminSupportTicket, AdminSupportTicketsSortKey>[]>(
    () => [
      {
        key: 'number',
        header: 'Request',
        sortKey: 'number',
        cell: (ticket) => (
          <div className="min-w-0">
            <Link
              route="admin.support.tickets.show"
              routeParams={{ id: ticket.id }}
              className="line-clamp-1 text-[13.5px] font-medium text-ink hover:underline"
            >
              {ticket.fullName}
            </Link>
            <div className="mt-0.5 truncate text-[12px] text-muted">
              <span className="font-mono">{ticket.reference}</span> · {ticket.email}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (ticket) => {
          const meta = supportStatusMeta[ticket.status]
          return (
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          )
        },
      },
      {
        key: 'assignee',
        header: 'Assigned to',
        cell: (ticket) =>
          ticket.assignedUser ? (
            <span className="truncate text-[13px]">{ticket.assignedUser.name}</span>
          ) : (
            <span className={dataTable.mono}>—</span>
          ),
      },
      {
        key: 'lastMessageAt',
        header: 'Last message',
        sortKey: 'lastMessageAt',
        cell: (ticket) => (
          <span className={`${dataTable.mono} whitespace-nowrap`}>
            {formatDateTime(ticket.lastMessageAt)}
          </span>
        ),
      },
    ],
    [formatDateTime]
  )

  return (
    <Page
      eyebrow="Back office · Customer service"
      title="Inbox"
      description="Requests sent from the storefront help chat when the help guides didn't have the answer. Replies are emailed to the customer with a private link back to the conversation."
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search requests"
              placeholder="Search by name, email or SR- number…"
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
                name="support-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[11rem] sm:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(SupportTicketStatusFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All status' },
                  ...SUPPORT_TICKET_STATUSES.map((value) => ({
                    value,
                    label: supportStatusMeta[value].label,
                  })),
                ]}
              />
              <FormSelectWithSearch
                name="support-assigned-filter"
                label="Filter by assignee"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={assigned}
                onChange={(next) => {
                  setAssigned(SupportTicketAssignedFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'Anyone' },
                  { value: 'me', label: 'Assigned to me' },
                  { value: 'unassigned', label: 'Unassigned' },
                ]}
              />
            </div>
          }
        />

        {canEdit && (
          <DataTableBulkBar
            selectedCount={selection.selectedIds.length}
            onClear={selection.clear}
            noun={selection.noun}
          >
            <FormButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={bulkDisabled}
              onClick={() =>
                bulkStatus.mutate(
                  { ids: selection.selectedIds, status: 'closed' },
                  selection.feedback('closed')
                )
              }
            >
              <CircleCheck size={15} /> Close
            </FormButton>
            <FormButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={bulkDisabled}
              onClick={() =>
                bulkStatus.mutate(
                  { ids: selection.selectedIds, status: 'open' },
                  selection.feedback('reopened')
                )
              }
            >
              <RotateCcw size={15} /> Reopen
            </FormButton>
          </DataTableBulkBar>
        )}

        <InfiniteDataTable
          selectedIds={canEdit ? selection.selectedIds : undefined}
          onSelectionChange={canEdit ? selection.setSelectedIds : undefined}
          label="Support requests"
          list={list}
          columns={columns}
          getRowId={(ticket) => ticket.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={(ticket) => (
            <Link
              route="admin.support.tickets.show"
              routeParams={{ id: ticket.id }}
              className={`${iconButton} size-7 border-transparent`}
              aria-label={`Open ${ticket.reference}`}
              title="Open conversation"
            >
              <Eye size={15} />
            </Link>
          )}
          emptySlot={filtered ? 'No requests match your filters.' : 'No support requests yet.'}
          errorMessage="Could not load support requests."
        />
      </section>
    </Page>
  )
}

AdminSupportTicketsHome.layout = [AdminLayout]
