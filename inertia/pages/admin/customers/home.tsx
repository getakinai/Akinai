import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Eye, LogIn, Plus, Save, SlidersHorizontal, Trash2, X } from 'lucide-react'
import Page from '~/components/page'
import {
  BulkArchiveActions,
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
import { countryName } from '~/lib/countries'
import { buttonClasses, card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import DeleteSegmentDialog from './_delete_segment_dialog'
import FiltersDialog from './_filters_dialog'
import ImpersonateDialog from './_impersonate_dialog'
import { accountStateMeta, customerDisplayName } from './_format'
import {
  useAdminCustomerSegments,
  useAdminCustomersInfinite,
  useBulkSetAdminCustomersArchived,
} from './_hooks'
import SegmentDialog from './_segment_dialog'
import {
  describeFilters,
  EMPTY_SEGMENT_FILTERS,
  filtersEqual,
  segmentToFilters,
} from './_segment_filters'
import {
  AdminCustomerStatusFilterSchema,
  type AdminCustomerListItem,
  type AdminCustomerSegment,
  type AdminCustomerSegmentFilters,
  type AdminCustomerStatusFilter,
  type AdminCustomersSortKey,
} from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const MAX_LISTED_TAGS = 3

const columns: DataTableColumn<AdminCustomerListItem, AdminCustomersSortKey>[] = [
  {
    key: 'fullName',
    header: 'Customer',
    sortKey: 'fullName',
    cell: (customer) => (
      <div className="min-w-0">
        <Link
          route="admin.customers.edit"
          routeParams={{ id: customer.id }}
          className="truncate text-[13.5px] font-medium text-ink hover:underline"
        >
          {customerDisplayName(customer)}
        </Link>
        {(!customer.isActive || customer.tags.length > 0) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {!customer.isActive && <Badge tone="warning">Archived</Badge>}
            {customer.tags.slice(0, MAX_LISTED_TAGS).map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
            {customer.tags.length > MAX_LISTED_TAGS && (
              <span className="text-[12px] text-muted">
                +{customer.tags.length - MAX_LISTED_TAGS}
              </span>
            )}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    sortKey: 'email',
    cell: (customer) => <span className="truncate text-[13px]">{customer.email}</span>,
  },
  {
    key: 'marketing',
    header: 'Marketing',
    cell: (customer) =>
      customer.acceptsMarketing ? (
        <Badge tone="success" dot>
          Subscribed
        </Badge>
      ) : (
        <Badge tone="neutral">Not subscribed</Badge>
      ),
  },
  {
    key: 'orders',
    header: 'Orders',
    align: 'right',
    cell: (customer) => <span className={dataTable.mono}>{customer.ordersCount}</span>,
  },
  {
    key: 'lastOrder',
    header: 'Last order',
    cell: (customer) => (
      <span className={dataTable.mono}>
        {customer.lastOrderAt ? dateFormat.format(new Date(customer.lastOrderAt)) : '—'}
      </span>
    ),
  },
  {
    key: 'account',
    header: 'Account',
    cell: (customer) => {
      const meta = accountStateMeta[customer.accountState]
      return (
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
      )
    },
  },
  {
    key: 'createdAt',
    header: 'Added',
    sortKey: 'createdAt',
    cell: (customer) => (
      <span className={dataTable.mono}>{dateFormat.format(new Date(customer.createdAt))}</span>
    ),
  },
]

export default function AdminCustomersHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminCustomersSortKey>({
    defaultSort: { key: 'createdAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminCustomerStatusFilter>('')
  const [filters, setFilters] = useState<AdminCustomerSegmentFilters>(EMPTY_SEGMENT_FILTERS)
  const [segmentId, setSegmentId] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersKey, setFiltersKey] = useState(0)
  const [segmentDialog, setSegmentDialog] = useState<'create' | 'update' | null>(null)
  const [deleting, setDeleting] = useState<AdminCustomerSegment | null>(null)
  const [impersonating, setImpersonating] = useState<AdminCustomerListItem | null>(null)
  const list = useAdminCustomersInfinite({ ...query, status, ...filters })
  const segments = useAdminCustomerSegments()
  const canCreate = useCan('customers.create')
  const canEdit = useCan('customers.edit')
  const canArchive = useCan('customers.archive')
  const selection = useBulkSelection(['customer', 'customers'])
  const bulkArchive = useBulkSetAdminCustomersArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  const segment = segments.data?.find((saved) => saved.id === segmentId) ?? null
  const filterLabels = describeFilters(filters, countryName)
  const hasFilters = filterLabels.length > 0
  const segmentChanged = segment !== null && !filtersEqual(segmentToFilters(segment), filters)

  function applyFilters(next: AdminCustomerSegmentFilters) {
    setFilters(next)
    selection.clear()
  }

  function chooseSegment(id: string) {
    setSegmentId(id)
    const chosen = segments.data?.find((saved) => saved.id === id)
    applyFilters(chosen ? segmentToFilters(chosen) : EMPTY_SEGMENT_FILTERS)
  }

  function openFilters() {
    setFiltersKey((key) => key + 1)
    setFiltersOpen(true)
  }

  return (
    <Page
      eyebrow="Back office · Customers"
      title="Customers"
      description="Everyone who has a relationship with your store, with or without a storefront account."
      actions={
        canCreate && (
          <Link route="admin.customers.create" className={buttonClasses({ size: 'sm' })}>
            <Plus size={15} /> Add customer
          </Link>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search customers"
              placeholder="Search by name, email or phone…"
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
                name="customers-segment"
                label="Segment"
                hideLabel
                compact
                className="w-full min-w-[11rem] sm:w-auto"
                isLoading={segments.isLoading}
                value={segmentId}
                onChange={chooseSegment}
                options={[
                  { value: '', label: 'All customers' },
                  ...(segments.data ?? []).map((saved) => ({
                    value: saved.id,
                    label: saved.name,
                  })),
                ]}
              />
              <FormSelectWithSearch
                name="customers-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(AdminCustomerStatusFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All status' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <FormButton type="button" variant="secondary" size="sm" onClick={openFilters}>
                <SlidersHorizontal size={15} />
                Filters
                {hasFilters && <Badge tone="neutral">{filterLabels.length}</Badge>}
              </FormButton>
            </>
          }
        />

        {(hasFilters || segment) && (
          <div className="mb-4 flex flex-col gap-2.5 rounded-lg border border-line bg-paper p-3 sm:flex-row sm:items-center sm:justify-between">
            <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Active filters">
              {segment && (
                <li>
                  <Badge tone="info">
                    {segment.name}
                    {segmentChanged ? ' (edited)' : ''}
                  </Badge>
                </li>
              )}
              {filterLabels.map((label) => (
                <li key={label}>
                  <Badge tone="neutral">{label}</Badge>
                </li>
              ))}
              {!hasFilters && <li className="text-[13px] text-muted">No filters</li>}
            </ul>
            <div className="flex flex-wrap gap-2">
              {canEdit && hasFilters && (!segment || segmentChanged) && (
                <FormButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSegmentDialog('create')}
                >
                  <Save size={14} /> Save as segment
                </FormButton>
              )}
              {canEdit && segment && segmentChanged && (
                <FormButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSegmentDialog('update')}
                >
                  Update “{segment.name}”
                </FormButton>
              )}
              {canEdit && segment && (
                <FormButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(segment)}
                >
                  <Trash2 size={14} /> Delete segment
                </FormButton>
              )}
              <FormButton type="button" variant="ghost" size="sm" onClick={() => chooseSegment('')}>
                <X size={14} /> Clear
              </FormButton>
            </div>
          </div>
        )}

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
          label="Customers"
          list={list}
          columns={columns}
          getRowId={(customer) => customer.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={(customer) => (
            <div className="flex items-center justify-end gap-1">
              {customer.accountState === 'enabled' && customer.isActive && (
                <button
                  type="button"
                  onClick={() => setImpersonating(customer)}
                  className={`${iconButton} size-7 border-transparent`}
                  aria-label={`Impersonate ${customerDisplayName(customer)}`}
                  title={`Impersonate ${customerDisplayName(customer)}`}
                >
                  <LogIn size={15} />
                </button>
              )}
              <Link
                route="admin.customers.edit"
                routeParams={{ id: customer.id }}
                className={`${iconButton} size-7 border-transparent`}
                aria-label={`${canEdit ? 'Edit' : 'View'} ${customerDisplayName(customer)}`}
                title={`${canEdit ? 'Edit' : 'View'} ${customerDisplayName(customer)}`}
              >
                <Eye size={15} />
              </Link>
            </div>
          )}
          emptySlot={
            query.q || status || hasFilters
              ? 'No customers match your filters.'
              : 'No customers yet.'
          }
          errorMessage="Could not load customers."
        />
      </section>

      <FiltersDialog
        key={filtersKey}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={applyFilters}
      />
      {segmentDialog && (
        <SegmentDialog
          open
          onClose={() => setSegmentDialog(null)}
          segment={segmentDialog === 'update' ? segment : null}
          filters={filters}
          onSaved={(saved) => setSegmentId(saved.id)}
        />
      )}
      <DeleteSegmentDialog
        segment={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => chooseSegment('')}
      />
      {impersonating && (
        <ImpersonateDialog
          key={impersonating.id}
          open
          customer={impersonating}
          onClose={() => setImpersonating(null)}
        />
      )}
    </Page>
  )
}

AdminCustomersHome.layout = [AdminLayout]
