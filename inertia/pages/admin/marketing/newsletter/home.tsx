import { useState } from 'react'
import { BellOff, BellRing } from 'lucide-react'
import Page from '~/components/page'
import {
  InfiniteDataTable,
  DataTableBulkBar,
  DataTableToolbar,
  type DataTableColumn,
} from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { Badge, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { card, dataTable, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../../_hooks'
import {
  useAdminNewsletterSubscribersInfinite,
  useBulkSetAdminNewsletterSubscribed,
} from './_hooks'
import {
  AdminNewsletterSourceFilterSchema,
  AdminNewsletterStatusFilterSchema,
  type AdminNewsletterSourceFilter,
  type AdminNewsletterStatusFilter,
  type AdminNewsletterSubscriber,
  type AdminNewsletterSubscribersSortKey,
} from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const SOURCE_LABELS: Record<AdminNewsletterSubscriber['source'], string> = {
  footer: 'Storefront',
  maintenance: 'Maintenance page',
}

const columns: DataTableColumn<AdminNewsletterSubscriber, AdminNewsletterSubscribersSortKey>[] = [
  {
    key: 'email',
    header: 'Email',
    sortKey: 'email',
    cell: (subscriber) => (
      <span className="min-w-0 truncate text-[13.5px] font-medium text-ink">
        {subscriber.email}
      </span>
    ),
  },
  {
    key: 'source',
    header: 'Signed up on',
    cell: (subscriber) => <span className="text-[13px]">{SOURCE_LABELS[subscriber.source]}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (subscriber) =>
      subscriber.isSubscribed ? (
        <Badge tone="success" dot>
          Subscribed
        </Badge>
      ) : (
        <Badge tone="neutral" dot>
          Unsubscribed
        </Badge>
      ),
  },
  {
    key: 'subscribedAt',
    header: 'Subscribed',
    sortKey: 'subscribedAt',
    cell: (subscriber) => (
      <span className={dataTable.mono}>{dateFormat.format(new Date(subscriber.subscribedAt))}</span>
    ),
  },
]

export default function AdminNewsletterSubscribersHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminNewsletterSubscribersSortKey>({
    defaultSort: { key: 'subscribedAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminNewsletterStatusFilter>('subscribed')
  const [source, setSource] = useState<AdminNewsletterSourceFilter>('')
  const list = useAdminNewsletterSubscribersInfinite({ ...query, status, source })
  const canEdit = useCan('newsletter_subscribers.edit')
  const selection = useBulkSelection(['subscriber', 'subscribers'])
  const bulkSubscription = useBulkSetAdminNewsletterSubscribed()
  const bulkDisabled = bulkSubscription.isPending || selection.tooMany

  return (
    <Page
      eyebrow="Back office · Marketing"
      title="Newsletter"
      description="Emails signed up through the newsletter forms on the storefront and the maintenance page."
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search subscribers"
              placeholder="Search by email…"
              value={query.q}
              onDebouncedChange={(next) => {
                setSearch(next)
                selection.clear()
              }}
              className={listToolbarSearch}
            />
          }
          right={
            <>
              <FormSelectWithSearch
                name="newsletter-source-filter"
                label="Filter by source"
                hideLabel
                compact
                className="w-full min-w-[11rem] sm:w-auto"
                value={source}
                onChange={(next) => {
                  setSource(AdminNewsletterSourceFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All sources' },
                  { value: 'footer', label: SOURCE_LABELS.footer },
                  { value: 'maintenance', label: SOURCE_LABELS.maintenance },
                ]}
              />
              <FormSelectWithSearch
                name="newsletter-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(AdminNewsletterStatusFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: 'subscribed', label: 'Subscribed' },
                  { value: 'unsubscribed', label: 'Unsubscribed' },
                  { value: '', label: 'All subscribers' },
                ]}
              />
            </>
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
                bulkSubscription.mutate(
                  { ids: selection.selectedIds, subscribed: false },
                  selection.feedback('unsubscribed')
                )
              }
            >
              <BellOff size={15} /> Unsubscribe
            </FormButton>
            <FormButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={bulkDisabled}
              onClick={() =>
                bulkSubscription.mutate(
                  { ids: selection.selectedIds, subscribed: true },
                  selection.feedback('resubscribed')
                )
              }
            >
              <BellRing size={15} /> Resubscribe
            </FormButton>
          </DataTableBulkBar>
        )}

        <InfiniteDataTable
          selectedIds={canEdit ? selection.selectedIds : undefined}
          onSelectionChange={canEdit ? selection.setSelectedIds : undefined}
          label="Newsletter subscribers"
          list={list}
          columns={columns}
          getRowId={(subscriber) => subscriber.id}
          sort={sort}
          onSortChange={setSort}
          emptySlot={
            query.q || source || status !== 'subscribed'
              ? 'No subscribers match your filters.'
              : 'No newsletter subscribers yet.'
          }
          errorMessage="Could not load newsletter subscribers."
        />
      </section>
    </Page>
  )
}

AdminNewsletterSubscribersHome.layout = [AdminLayout]
