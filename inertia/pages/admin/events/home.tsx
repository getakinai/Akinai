import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Eye, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import Page from '~/components/page'
import { InfiniteDataTable, DataTableToolbar, type DataTableColumn } from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { Badge, SearchInput } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { handleMutationError } from '~/lib/form'
import { card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import { actorName } from '../_notification_hooks'
import EventDialog from './_event_dialog'
import { eventStatusMeta, eventTypeLabels } from './_format'
import { useAdminEventsInfinite, useRetryAdminEvent, useRetryFailedAdminEvents } from './_hooks'
import {
  ADMIN_EVENT_STATUSES,
  ADMIN_EVENT_TYPES,
  AdminEventStatusFilterSchema,
  AdminEventTypeFilterSchema,
  type AdminEvent,
  type AdminEventStatusFilter,
  type AdminEventsSortKey,
  type AdminEventTypeFilter,
} from './_types'

const ignoreFieldErrors = () => undefined

export default function AdminEventsHome() {
  const { formatDateTime } = useDateFormat()
  const { query, sort, setSearch, setSort } = useListQueryState<AdminEventsSortKey>({
    defaultSort: { key: 'createdAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminEventStatusFilter>('')
  const [type, setType] = useState<AdminEventTypeFilter>('')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const list = useAdminEventsInfinite({ ...query, status, type })
  const canRetry = useCan('events.edit')
  const retry = useRetryAdminEvent()
  const retryFailed = useRetryFailedAdminEvents()
  const filtered = Boolean(query.q || status || type)

  function resend(event: AdminEvent) {
    retry.mutate(event.id, {
      onSuccess: (updated) =>
        updated.status === 'delivered'
          ? toast.success('Notification re-sent')
          : toast.error(updated.lastError ?? 'Could not re-send the notification'),
      onError: (error) => handleMutationError(error, ignoreFieldErrors),
    })
  }

  function resendFailed() {
    retryFailed.mutate(undefined, {
      onSuccess: ({ retried, delivered }) => {
        if (retried === 0) toast.info('No failed notifications to re-send')
        else if (delivered === retried) toast.success(`Re-sent ${delivered} notifications`)
        else toast.warning(`Re-sent ${delivered} of ${retried}; the rest failed again`)
      },
      onError: (error) => handleMutationError(error, ignoreFieldErrors),
    })
  }

  const columns: DataTableColumn<AdminEvent, AdminEventsSortKey>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      sortKey: 'createdAt',
      cell: (event) => (
        <span className={`${dataTable.mono} whitespace-nowrap`}>
          {formatDateTime(event.createdAt)}
        </span>
      ),
    },
    {
      key: 'event',
      header: 'Event',
      cell: (event) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setViewingId(event.id)}
            className="line-clamp-2 text-left text-[13.5px] text-ink hover:underline"
          >
            <span className="font-semibold">{actorName(event)}</span> {event.title}
          </button>
          <div className="mt-0.5 text-[12px] text-muted">{eventTypeLabels[event.type]}</div>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (event) =>
        event.orderId ? (
          <Link
            route="admin.orders.show"
            routeParams={{ id: event.orderId }}
            className="text-[13px] whitespace-nowrap text-accent hover:underline"
          >
            {event.subjectType === 'Order' ? (event.subjectLabel ?? 'Order') : 'Order'}
          </Link>
        ) : (
          <span className={dataTable.mono}>—</span>
        ),
    },
    {
      key: 'status',
      header: 'Delivery',
      cell: (event) => {
        const meta = eventStatusMeta[event.status]
        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
            <span className="text-[12px] text-muted">
              {event.attempts} {event.attempts === 1 ? 'attempt' : 'attempts'}
            </span>
          </div>
        )
      },
    },
  ]

  return (
    <Page
      eyebrow="Back office · Settings"
      title="Events"
      description="Live notifications sent to staff in the last 90 days, who triggered them and whether they reached connected browsers."
      actions={
        canRetry && (
          <FormButton
            type="button"
            size="sm"
            variant="secondary"
            loading={retryFailed.isPending}
            loadingText="Re-sending…"
            onClick={resendFailed}
          >
            <RotateCw size={15} /> Re-send failed
          </FormButton>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search events"
              placeholder="Search by event or actor…"
              value={query.q}
              onDebouncedChange={setSearch}
              className={listToolbarSearch}
            />
          }
          right={
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <FormSelectWithSearch
                name="events-status-filter"
                label="Filter by delivery"
                hideLabel
                compact
                className="w-full min-w-[9rem] sm:w-auto"
                value={status}
                onChange={(next) => setStatus(AdminEventStatusFilterSchema.parse(next))}
                options={[
                  { value: '', label: 'All deliveries' },
                  ...ADMIN_EVENT_STATUSES.map((value) => ({
                    value,
                    label: eventStatusMeta[value].label,
                  })),
                ]}
              />
              <FormSelectWithSearch
                name="events-type-filter"
                label="Filter by type"
                hideLabel
                compact
                className="w-full min-w-[12rem] sm:w-auto"
                value={type}
                onChange={(next) => setType(AdminEventTypeFilterSchema.parse(next))}
                options={[
                  { value: '', label: 'All events' },
                  ...ADMIN_EVENT_TYPES.map((value) => ({ value, label: eventTypeLabels[value] })),
                ]}
              />
            </div>
          }
        />

        <InfiniteDataTable
          label="Events"
          list={list}
          columns={columns}
          getRowId={(event) => event.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={(event) => (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`${iconButton} size-7 border-transparent`}
                aria-label="View event details"
                title="View details"
                onClick={() => setViewingId(event.id)}
              >
                <Eye size={15} />
              </button>
              {canRetry && (
                <button
                  type="button"
                  className={`${iconButton} size-7 border-transparent`}
                  aria-label="Re-send notification"
                  title="Re-send"
                  disabled={retry.isPending}
                  onClick={() => resend(event)}
                >
                  <RotateCw size={15} />
                </button>
              )}
            </div>
          )}
          emptySlot={filtered ? 'No events match your filters.' : 'No events yet.'}
          errorMessage="Could not load events."
        />
      </section>

      {viewingId && <EventDialog id={viewingId} onClose={() => setViewingId(null)} />}
    </Page>
  )
}

AdminEventsHome.layout = [AdminLayout]
