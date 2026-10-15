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
import { FormButton } from '~/components/form'
import { Badge, IconButton, SearchInput } from '~/components/ui'
import { FormSelectWithSearch } from '~/components/form'
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
  useAdminLocationsInfinite,
  useArchiveAdminLocation,
  useBulkSetAdminLocationsArchived,
  useUnarchiveAdminLocation,
  useExportAdminLocations,
  useImportAdminLocations,
} from './_hooks'
import LocationDialog from './_location_dialog'
import {
  AdminLocationStatusFilterSchema,
  type AdminLocation,
  type AdminLocationStatusFilter,
  type AdminLocationsSortKey,
  LOCATION_IMPORT_COLUMNS,
} from './_types'

type LocationDialogState = { open: false } | { open: true; location: AdminLocation | null }

const columns: DataTableColumn<AdminLocation, AdminLocationsSortKey>[] = [
  {
    key: 'name',
    header: 'Location',
    sortKey: 'name',
    cell: (location) => (
      <div className="flex items-center gap-2">
        <span className="text-[13.5px] font-medium text-ink">{location.name}</span>
        {location.isDefault && <Badge tone="info">Default</Badge>}
      </div>
    ),
  },
  {
    key: 'address',
    header: 'Address',
    cell: (location) =>
      [location.addressLine, location.city, location.country].filter(Boolean).join(', ') || '—',
  },
  {
    key: 'stock',
    header: 'Available',
    align: 'right',
    cell: (location) => <span className={dataTable.mono}>{location.availableTotal ?? 0}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (location) =>
      location.isActive ? (
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

function archiveBlockedReason(location: AdminLocation) {
  if (location.isDefault) return 'The default location cannot be archived'
  if ((location.availableTotal ?? 0) > 0) return 'Move or zero out the stock here first'
  return null
}

export default function AdminLocationsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminLocationsSortKey>({
    defaultSort: { key: 'name', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminLocationStatusFilter>('active')
  const [dialog, setDialog] = useState<LocationDialogState>({ open: false })
  const list = useAdminLocationsInfinite({ ...query, status })
  const archive = useArchiveAdminLocation()
  const unarchive = useUnarchiveAdminLocation()

  const canCreate = useCan('locations.create')
  const canTransfer = useCanCsvTransfer('locations')
  const exportLocations = useExportAdminLocations()
  const importLocations = useImportAdminLocations()
  const canEdit = useCan('locations.edit')
  const canArchive = useCan('locations.archive')
  const selection = useBulkSelection(['location', 'locations'])
  const bulkArchive = useBulkSetAdminLocationsArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(location: AdminLocation) {
    if (location.isActive) {
      archive.mutate(location.id, {
        onSuccess: (saved) => toast.success(`${saved.name} archived`),
        onError,
      })
    } else {
      unarchive.mutate(location.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Catalog"
      title="Locations"
      description="Warehouses, stores and other places where you keep stock."
      actions={
        (canTransfer || canCreate) && (
          <>
            <CsvTransferActions
              resource="locations"
              exportMutation={exportLocations}
              exportQuery={{ ...query, status }}
              renderImportDialog={(onClose) => (
                <AdminCsvImportDialog
                  description="Upload a CSV with one location per row. Names that already exist are skipped, and imported locations never become the default."
                  noun={['location', 'locations']}
                  sampleHref={urlFor('admin.locations.import.sample')}
                  columns={LOCATION_IMPORT_COLUMNS}
                  previewColumns={['name', 'city', 'country', 'status']}
                  hint="Up to 1,000 rows and 2 MB. Status is active or archived (active when empty)."
                  mutation={importLocations}
                  onClose={onClose}
                />
              )}
            />
            {canCreate && (
              <FormButton
                type="button"
                size="sm"
                onClick={() => setDialog({ open: true, location: null })}
              >
                <Plus size={15} /> Add location
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
              label="Search locations"
              placeholder="Search by name, city or country…"
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
              name="locations-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminLocationStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All locations' },
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
          label="Locations"
          list={list}
          columns={columns}
          getRowId={(location) => location.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (location) => {
                  const blocked = location.isActive ? archiveBlockedReason(location) : null
                  return (
                    <>
                      {canEdit && (
                        <IconButton
                          label={`Edit ${location.name}`}
                          size="sm"
                          onClick={() => setDialog({ open: true, location })}
                        >
                          <Pencil size={15} />
                        </IconButton>
                      )}
                      {canArchive && (
                        <IconButton
                          label={
                            blocked ??
                            (location.isActive
                              ? `Archive ${location.name}`
                              : `Restore ${location.name}`)
                          }
                          size="sm"
                          disabled={blocked !== null || archive.isPending || unarchive.isPending}
                          onClick={() => onToggleArchive(location)}
                        >
                          {location.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                        </IconButton>
                      )}
                    </>
                  )
                }
              : undefined
          }
          emptySlot={query.q ? 'No locations match your search.' : 'No locations yet.'}
          errorMessage="Could not load locations."
        />
      </section>

      {dialog.open && (
        <LocationDialog
          key={dialog.location?.id ?? 'new'}
          open
          location={dialog.location}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </Page>
  )
}

AdminLocationsHome.layout = [AdminLayout]
