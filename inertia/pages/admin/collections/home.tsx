import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Pencil, Plus } from 'lucide-react'
import { urlFor } from '~/client'
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
import CsvTransferActions, {
  AdminCsvImportDialog,
  useCanCsvTransfer,
} from '../_csv_transfer_actions'
import { useCan } from '../_hooks'
import { collectionStatusMeta, collectionTypeMeta } from './_format'
import {
  useAdminCollectionsInfinite,
  useBulkSetAdminCollectionsArchived,
  useBulkSetAdminCollectionsStatus,
  useExportAdminCollections,
  useImportAdminCollections,
} from './_hooks'
import {
  AdminCollectionStatusFilterSchema,
  AdminCollectionTypeFilterSchema,
  type AdminCollection,
  type AdminCollectionStatusFilter,
  type AdminCollectionTypeFilter,
  type AdminCollectionsSortKey,
  COLLECTION_IMPORT_COLUMNS,
} from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

const columns: DataTableColumn<AdminCollection, AdminCollectionsSortKey>[] = [
  {
    key: 'title',
    header: 'Collection',
    sortKey: 'title',
    cell: (collection) => (
      <div className="min-w-0">
        <Link
          route="admin.collections.edit"
          routeParams={{ id: collection.id }}
          className="truncate text-[13.5px] font-medium text-ink hover:underline"
        >
          {collection.title}
        </Link>
        <div className={`truncate ${dataTable.mono}`}>/collections/{collection.slug}</div>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    cell: (collection) => {
      const meta = collectionTypeMeta[collection.type]
      return <Badge tone={meta.tone}>{meta.label}</Badge>
    },
  },
  {
    key: 'products',
    header: 'Products',
    cell: (collection) => (
      <span className="text-[13px]">
        {collection.productsCount}
        {collection.type === 'automated' && (
          <span className="text-muted">
            {' '}
            · {collection.rules.length} {collection.rules.length === 1 ? 'condition' : 'conditions'}
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortKey: 'status',
    cell: (collection) => {
      const meta = collectionStatusMeta[collection.status]
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
    cell: (collection) => (
      <span className={dataTable.mono}>
        {dateFormat.format(new Date(collection.updatedAt ?? collection.createdAt))}
      </span>
    ),
  },
]

export default function AdminCollectionsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminCollectionsSortKey>({
    defaultSort: { key: 'updatedAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminCollectionStatusFilter>('')
  const [type, setType] = useState<AdminCollectionTypeFilter>('')
  const selection = useBulkSelection(['collection', 'collections'])
  const list = useAdminCollectionsInfinite({ ...query, status, type })
  const canCreate = useCan('collections.create')
  const canTransfer = useCanCsvTransfer('collections')
  const exportCollections = useExportAdminCollections()
  const importCollections = useImportAdminCollections()
  const canEdit = useCan('collections.edit')
  const canArchive = useCan('collections.archive')
  const bulkStatus = useBulkSetAdminCollectionsStatus()
  const bulkArchive = useBulkSetAdminCollectionsArchived()
  const bulkDisabled = bulkStatus.isPending || bulkArchive.isPending || selection.tooMany
  const filtered = Boolean(query.q || status || type)
  const selectable = canEdit || canArchive

  return (
    <Page
      eyebrow="Back office · Catalog"
      title="Collections"
      description="Group products by category, theme or campaign so shoppers can find them."
      actions={
        (canTransfer || canCreate) && (
          <>
            <CsvTransferActions
              resource="collections"
              exportMutation={exportCollections}
              exportQuery={{ ...query, status, type }}
              renderImportDialog={(onClose) => (
                <AdminCsvImportDialog
                  description='Upload a CSV with one collection per row. Automated collections list one rule per line in the rules cell, for example "vendor equals Acme". Handles that already exist are skipped.'
                  noun={['collection', 'collections']}
                  sampleHref={urlFor('admin.collections.import.sample')}
                  columns={COLLECTION_IMPORT_COLUMNS}
                  previewColumns={['title', 'handle', 'type', 'status']}
                  hint="Up to 1,000 rows and 2 MB. Manual product picks are not imported."
                  mutation={importCollections}
                  onClose={onClose}
                />
              )}
            />
            {canCreate && (
              <Link route="admin.collections.create" className={buttonClasses({ size: 'sm' })}>
                <Plus size={15} /> Create collection
              </Link>
            )}
          </>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search collections"
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
                name="collections-type-filter"
                label="Filter by type"
                hideLabel
                compact
                className="w-full min-w-[9rem] sm:w-auto"
                value={type}
                onChange={(next) => {
                  setType(AdminCollectionTypeFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All types' },
                  { value: 'automated', label: 'Automated' },
                  { value: 'manual', label: 'Manual' },
                ]}
              />
              <FormSelectWithSearch
                name="collections-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[9rem] sm:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(AdminCollectionStatusFilterSchema.parse(next))
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
          label="Collections"
          list={list}
          columns={columns}
          getRowId={(collection) => collection.id}
          sort={sort}
          onSortChange={setSort}
          selectedIds={selectable ? selection.selectedIds : undefined}
          onSelectionChange={selectable ? selection.setSelectedIds : undefined}
          rowActions={
            canEdit
              ? (collection) => (
                  <Link
                    route="admin.collections.edit"
                    routeParams={{ id: collection.id }}
                    className={`${iconButton} size-7 border-transparent`}
                    aria-label={`Edit ${collection.title}`}
                    title={`Edit ${collection.title}`}
                  >
                    <Pencil size={15} />
                  </Link>
                )
              : undefined
          }
          emptySlot={filtered ? 'No collections match your filters.' : 'No collections yet.'}
          errorMessage="Could not load collections."
        />
      </section>
    </Page>
  )
}

AdminCollectionsHome.layout = [AdminLayout]
