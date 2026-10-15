import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react'
import { urlFor } from '~/client'
import Page from '~/components/page'
import {
  BulkArchiveActions,
  InfiniteDataTable,
  DataTableBulkBar,
  DataTableToolbar,
  type DataTableColumn,
} from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { Badge, IconButton, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { card, dataTable, listToolbarSearch } from '~/lib/styles'
import CsvTransferActions, {
  AdminCsvImportDialog,
  useCanCsvTransfer,
} from '../_csv_transfer_actions'
import { useCan } from '../_hooks'
import {
  useAdminProductTypesInfinite,
  useArchiveAdminProductType,
  useBulkSetAdminProductTypesArchived,
  useUnarchiveAdminProductType,
  useExportAdminProductTypes,
  useImportAdminProductTypes,
} from './_hooks'
import ProductTypeDialog from './_product_type_dialog'
import {
  AdminProductTypeStatusFilterSchema,
  type AdminProductType,
  type AdminProductTypeStatusFilter,
  type AdminProductTypesSortKey,
  PRODUCT_TYPE_IMPORT_COLUMNS,
} from './_types'

type ProductTypeDialogState = { open: false } | { open: true; productType: AdminProductType | null }

const columns: DataTableColumn<AdminProductType, AdminProductTypesSortKey>[] = [
  {
    key: 'name',
    header: 'Product type',
    sortKey: 'name',
    cell: (productType) => (
      <span className="text-[13.5px] font-medium text-ink">{productType.name}</span>
    ),
  },
  {
    key: 'products',
    header: 'Products',
    sortKey: 'productsCount',
    align: 'right',
    cell: (productType) => <span className={dataTable.mono}>{productType.productsCount}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (productType) =>
      productType.isActive ? (
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

export default function AdminProductTypesHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminProductTypesSortKey>({
    defaultSort: { key: 'name', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminProductTypeStatusFilter>('active')
  const [dialog, setDialog] = useState<ProductTypeDialogState>({ open: false })
  const list = useAdminProductTypesInfinite({ ...query, status })
  const archive = useArchiveAdminProductType()
  const unarchive = useUnarchiveAdminProductType()

  const canCreate = useCan('product_types.create')
  const canTransfer = useCanCsvTransfer('product_types')
  const exportProductTypes = useExportAdminProductTypes()
  const importProductTypes = useImportAdminProductTypes()
  const canEdit = useCan('product_types.edit')
  const canArchive = useCan('product_types.archive')
  const selection = useBulkSelection(['product type', 'product types'])
  const bulkArchive = useBulkSetAdminProductTypesArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(productType: AdminProductType) {
    if (productType.isActive) {
      archive.mutate(productType.id, {
        onSuccess: (saved) => toast.success(`${saved.name} archived`),
        onError,
      })
    } else {
      unarchive.mutate(productType.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Catalog"
      title="Product types"
      description="Kinds of products staff pick on the product form. Archived types stay on their products but can't be picked for new ones."
      actions={
        (canTransfer || canCreate) && (
          <>
            <CsvTransferActions
              resource="product_types"
              exportMutation={exportProductTypes}
              exportQuery={{ ...query, status }}
              renderImportDialog={(onClose) => (
                <AdminCsvImportDialog
                  description="Upload a CSV with one product type per row. Names that already exist are skipped."
                  noun={['product type', 'product types']}
                  sampleHref={urlFor('admin.product_types.import.sample')}
                  columns={PRODUCT_TYPE_IMPORT_COLUMNS}
                  hint="Up to 1,000 rows and 2 MB. Status is active or archived (active when empty)."
                  mutation={importProductTypes}
                  onClose={onClose}
                />
              )}
            />
            {canCreate && (
              <FormButton
                type="button"
                size="sm"
                onClick={() => setDialog({ open: true, productType: null })}
              >
                <Plus size={15} /> Add product type
              </FormButton>
            )}
          </>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search product types"
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
              name="product-types-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminProductTypeStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All product types' },
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
          label="Product types"
          list={list}
          columns={columns}
          getRowId={(productType) => productType.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (productType) => (
                  <>
                    {canEdit && productType.isActive && (
                      <IconButton
                        label={`Edit ${productType.name}`}
                        size="sm"
                        onClick={() => setDialog({ open: true, productType })}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canArchive && (
                      <IconButton
                        label={
                          productType.isActive
                            ? `Archive ${productType.name}`
                            : `Restore ${productType.name}`
                        }
                        size="sm"
                        disabled={archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(productType)}
                      >
                        {productType.isActive ? (
                          <Archive size={15} />
                        ) : (
                          <ArchiveRestore size={15} />
                        )}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No product types match your search.' : 'No product types yet.'}
          errorMessage="Could not load product types."
        />
      </section>

      {dialog.open && (
        <ProductTypeDialog
          key={dialog.productType?.id ?? 'new'}
          open
          productType={dialog.productType}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </Page>
  )
}

AdminProductTypesHome.layout = [AdminLayout]
