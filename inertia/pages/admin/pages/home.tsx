import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Pencil, Plus } from 'lucide-react'
import Page from '~/components/page'
import {
  BulkArchiveActions,
  BulkStatusActions,
  InfiniteDataTable,
  DataTableBulkBar,
  DataTableToolbar,
  type DataTableColumn,
} from '~/components/data_table'
import { FormSelectWithSearch } from '~/components/form'
import { Badge, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import { pageStatusMeta, policyLabels } from './_format'
import {
  useAdminPagesInfinite,
  useBulkSetAdminPagesArchived,
  useBulkSetAdminPagesStatus,
} from './_hooks'
import {
  AdminPageStatusFilterSchema,
  type AdminContentPageListItem,
  type AdminPageStatusFilter,
  type AdminPagesSortKey,
} from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

const columns: DataTableColumn<AdminContentPageListItem, AdminPagesSortKey>[] = [
  {
    key: 'title',
    header: 'Page',
    sortKey: 'title',
    cell: (page) => (
      <div className="min-w-0">
        <Link
          route="admin.pages.edit"
          routeParams={{ id: page.id }}
          className="truncate text-[13.5px] font-medium text-ink hover:underline"
        >
          {page.title}
        </Link>
        <div className={`truncate ${dataTable.mono}`}>/pages/{page.slug}</div>
      </div>
    ),
  },
  {
    key: 'policy',
    header: 'Policy',
    cell: (page) =>
      page.policyType ? (
        <Badge tone="info">{policyLabels[page.policyType]}</Badge>
      ) : (
        <span className="text-[13px] text-muted">—</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    sortKey: 'status',
    cell: (page) => {
      const meta = pageStatusMeta[page.status]
      return (
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
      )
    },
  },
  {
    key: 'updatedAt',
    header: 'Updated',
    sortKey: 'updatedAt',
    cell: (page) => (
      <span className={dataTable.mono}>
        {dateFormat.format(new Date(page.updatedAt ?? page.createdAt))}
      </span>
    ),
  },
]

export default function AdminPagesHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminPagesSortKey>({
    defaultSort: { key: 'updatedAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminPageStatusFilter>('')
  const selection = useBulkSelection(['page', 'pages'])
  const list = useAdminPagesInfinite({ ...query, status })
  const canCreate = useCan('pages.create')
  const canEdit = useCan('pages.edit')
  const canArchive = useCan('pages.archive')
  const bulkStatus = useBulkSetAdminPagesStatus()
  const bulkArchive = useBulkSetAdminPagesArchived()
  const bulkDisabled = bulkStatus.isPending || bulkArchive.isPending || selection.tooMany
  const filtered = Boolean(query.q || status)
  const selectable = canEdit || canArchive

  return (
    <Page
      eyebrow="Back office · Storefront"
      title="Pages"
      description="Content pages like About or FAQ, and your refund, shipping, privacy and terms policies."
      actions={
        canCreate && (
          <Link route="admin.pages.create" className={buttonClasses({ size: 'sm' })}>
            <Plus size={15} /> Create page
          </Link>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search pages"
              placeholder="Search by title…"
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
                name="pages-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[9rem] sm:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(AdminPageStatusFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All status' },
                  { value: 'active', label: 'Active' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
          }
        />

        <DataTableBulkBar
          selectedCount={selection.selectedIds.length}
          onClear={selection.clear}
          noun={selection.noun}
        >
          {canEdit && (
            <BulkStatusActions
              disabled={bulkDisabled}
              onActivate={() =>
                bulkStatus.mutate(
                  { ids: selection.selectedIds, status: 'active' },
                  selection.feedback('activated')
                )
              }
              onDraft={() =>
                bulkStatus.mutate(
                  { ids: selection.selectedIds, status: 'draft' },
                  selection.feedback('set to draft')
                )
              }
            />
          )}
          {canArchive && (
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
          )}
        </DataTableBulkBar>

        <InfiniteDataTable
          label="Pages"
          list={list}
          columns={columns}
          getRowId={(page) => page.id}
          sort={sort}
          onSortChange={setSort}
          selectedIds={selectable ? selection.selectedIds : undefined}
          onSelectionChange={selectable ? selection.setSelectedIds : undefined}
          rowActions={
            canEdit
              ? (page) => (
                  <Link
                    route="admin.pages.edit"
                    routeParams={{ id: page.id }}
                    className={`${iconButton} size-7 border-transparent`}
                    aria-label={`Edit ${page.title}`}
                    title={`Edit ${page.title}`}
                  >
                    <Pencil size={15} />
                  </Link>
                )
              : undefined
          }
          emptySlot={filtered ? 'No pages match your filters.' : 'No pages yet.'}
          errorMessage="Could not load pages."
        />
      </section>
    </Page>
  )
}

AdminPagesHome.layout = [AdminLayout]
