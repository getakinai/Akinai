import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react'
import Page from '~/components/page'
import {
  BulkArchiveActions,
  InfiniteDataTable,
  DataTableBulkBar,
  DataTableToolbar,
  type DataTableColumn,
} from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { ProductLabelBadge } from '~/components/storefront'
import { Badge, IconButton, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { card, dataTable, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useAdminProductLabelsInfinite,
  useArchiveAdminProductLabel,
  useBulkSetAdminProductLabelsArchived,
  useUnarchiveAdminProductLabel,
} from './_hooks'
import ProductLabelDialog from './_product_label_dialog'
import {
  AdminProductLabelStatusFilterSchema,
  type AdminProductLabel,
  type AdminProductLabelStatusFilter,
  type AdminProductLabelsSortKey,
} from './_types'

type ProductLabelDialogState =
  { open: false } | { open: true; productLabel: AdminProductLabel | null }

const columns: DataTableColumn<AdminProductLabel, AdminProductLabelsSortKey>[] = [
  {
    key: 'name',
    header: 'Label',
    sortKey: 'name',
    cell: (label) => <ProductLabelBadge label={label} />,
  },
  {
    key: 'products',
    header: 'Products',
    sortKey: 'productsCount',
    align: 'right',
    cell: (label) => <span className={dataTable.mono}>{label.productsCount}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (label) =>
      label.isActive ? (
        <Badge tone="success" dot>
          Active
        </Badge>
      ) : (
        <Badge tone="neutral" dot>
          Archived
        </Badge>
      ),
  },
]

export default function AdminProductLabelsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminProductLabelsSortKey>({
    defaultSort: { key: 'name', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminProductLabelStatusFilter>('active')
  const [dialog, setDialog] = useState<ProductLabelDialogState>({ open: false })
  const list = useAdminProductLabelsInfinite({ ...query, status })
  const archive = useArchiveAdminProductLabel()
  const unarchive = useUnarchiveAdminProductLabel()

  const canCreate = useCan('product_labels.create')
  const canEdit = useCan('product_labels.edit')
  const canArchive = useCan('product_labels.archive')
  const selection = useBulkSelection(['label', 'labels'])
  const bulkArchive = useBulkSetAdminProductLabelsArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(label: AdminProductLabel) {
    if (label.isActive) {
      archive.mutate(label.id, {
        onSuccess: (saved) => toast.success(`${saved.name} archived`),
        onError,
      })
    } else {
      unarchive.mutate(label.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Catalog"
      title="Labels"
      description="Badges such as New, Hot or Trending shown over product photos in the store. Archived labels are hidden from the store and can't be picked."
      actions={
        canCreate && (
          <FormButton
            type="button"
            size="sm"
            onClick={() => setDialog({ open: true, productLabel: null })}
          >
            <Plus size={15} /> Add label
          </FormButton>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search labels"
              placeholder="Search by name…"
              value={query.q}
              onDebouncedChange={(next) => {
                setSearch(next)
                selection.clear()
              }}
              className={listToolbarSearch}
            />
          }
          right={
            <FormSelectWithSearch
              name="product-labels-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminProductLabelStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All labels' },
              ]}
            />
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
          label="Labels"
          list={list}
          columns={columns}
          getRowId={(label) => label.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (label) => (
                  <>
                    {canEdit && label.isActive && (
                      <IconButton
                        label={`Edit ${label.name}`}
                        size="sm"
                        onClick={() => setDialog({ open: true, productLabel: label })}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canArchive && (
                      <IconButton
                        label={label.isActive ? `Archive ${label.name}` : `Restore ${label.name}`}
                        size="sm"
                        disabled={archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(label)}
                      >
                        {label.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No labels match your search.' : 'No labels yet.'}
          errorMessage="Could not load labels."
        />
      </section>

      {dialog.open && (
        <ProductLabelDialog
          key={dialog.productLabel?.id ?? 'new'}
          open
          productLabel={dialog.productLabel}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </Page>
  )
}

AdminProductLabelsHome.layout = [AdminLayout]
