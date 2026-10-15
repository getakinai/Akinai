import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, ImageIcon, Pencil, Plus } from 'lucide-react'
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
  useAdminVendorsInfinite,
  useArchiveAdminVendor,
  useBulkSetAdminVendorsArchived,
  useUnarchiveAdminVendor,
  useExportAdminVendors,
  useImportAdminVendors,
} from './_hooks'
import VendorDialog from './_vendor_dialog'
import {
  AdminVendorStatusFilterSchema,
  type AdminVendor,
  type AdminVendorStatusFilter,
  type AdminVendorsSortKey,
  VENDOR_IMPORT_COLUMNS,
} from './_types'

type VendorDialogState = { open: false } | { open: true; vendor: AdminVendor | null }

const columns: DataTableColumn<AdminVendor, AdminVendorsSortKey>[] = [
  {
    key: 'name',
    header: 'Vendor',
    sortKey: 'name',
    cell: (vendor) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 flex-none place-items-center overflow-hidden rounded-md border border-line bg-paper text-subtle">
          {vendor.imageUrl ? (
            <img
              src={vendor.imageUrl}
              alt=""
              loading="lazy"
              width={40}
              height={40}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon size={16} strokeWidth={1.5} />
          )}
        </span>
        <span className="min-w-0 truncate text-[13.5px] font-medium text-ink">{vendor.name}</span>
      </div>
    ),
  },
  {
    key: 'products',
    header: 'Products',
    sortKey: 'productsCount',
    align: 'right',
    cell: (vendor) => <span className={dataTable.mono}>{vendor.productsCount}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (vendor) =>
      vendor.isActive ? (
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

export default function AdminVendorsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminVendorsSortKey>({
    defaultSort: { key: 'name', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminVendorStatusFilter>('active')
  const [dialog, setDialog] = useState<VendorDialogState>({ open: false })
  const list = useAdminVendorsInfinite({ ...query, status })
  const archive = useArchiveAdminVendor()
  const unarchive = useUnarchiveAdminVendor()

  const canCreate = useCan('vendors.create')
  const canTransfer = useCanCsvTransfer('vendors')
  const exportVendors = useExportAdminVendors()
  const importVendors = useImportAdminVendors()
  const canEdit = useCan('vendors.edit')
  const canArchive = useCan('vendors.archive')
  const selection = useBulkSelection(['vendor', 'vendors'])
  const bulkArchive = useBulkSetAdminVendorsArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(vendor: AdminVendor) {
    if (vendor.isActive) {
      archive.mutate(vendor.id, {
        onSuccess: (saved) => toast.success(`${saved.name} archived`),
        onError,
      })
    } else {
      unarchive.mutate(vendor.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Catalog"
      title="Vendors"
      description="Brands and suppliers staff pick on the product form. Archived vendors stay on their products but can't be picked for new ones."
      actions={
        (canTransfer || canCreate) && (
          <>
            <CsvTransferActions
              resource="vendors"
              exportMutation={exportVendors}
              exportQuery={{ ...query, status }}
              renderImportDialog={(onClose) => (
                <AdminCsvImportDialog
                  description="Upload a CSV with one vendor per row. Names that already exist are skipped."
                  noun={['vendor', 'vendors']}
                  sampleHref={urlFor('admin.vendors.import.sample')}
                  columns={VENDOR_IMPORT_COLUMNS}
                  hint="Up to 1,000 rows and 2 MB. Status is active or archived (active when empty)."
                  mutation={importVendors}
                  onClose={onClose}
                />
              )}
            />
            {canCreate && (
              <FormButton
                type="button"
                size="sm"
                onClick={() => setDialog({ open: true, vendor: null })}
              >
                <Plus size={15} /> Add vendor
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
              label="Search vendors"
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
              name="vendors-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminVendorStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All vendors' },
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
          label="Vendors"
          list={list}
          columns={columns}
          getRowId={(vendor) => vendor.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (vendor) => (
                  <>
                    {canEdit && vendor.isActive && (
                      <IconButton
                        label={`Edit ${vendor.name}`}
                        size="sm"
                        onClick={() => setDialog({ open: true, vendor })}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canArchive && (
                      <IconButton
                        label={
                          vendor.isActive ? `Archive ${vendor.name}` : `Restore ${vendor.name}`
                        }
                        size="sm"
                        disabled={archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(vendor)}
                      >
                        {vendor.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No vendors match your search.' : 'No vendors yet.'}
          errorMessage="Could not load vendors."
        />
      </section>

      {dialog.open && (
        <VendorDialog
          key={dialog.vendor?.id ?? 'new'}
          open
          vendor={dialog.vendor}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </Page>
  )
}

AdminVendorsHome.layout = [AdminLayout]
