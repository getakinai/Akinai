import { useState } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
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
import { Badge, IconButton, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { card, dataTable, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useAdminShippingZonesInfinite,
  useArchiveAdminShippingZone,
  useBulkSetAdminShippingZonesArchived,
  useUnarchiveAdminShippingZone,
} from './_hooks'
import ZoneDialog from './_zone_dialog'
import {
  AdminShippingZoneStatusFilterSchema,
  type AdminShippingZone,
  type AdminShippingZoneStatusFilter,
  type AdminShippingZonesSortKey,
} from './_types'

const plural = (count: number, one: string, many: string) =>
  count > 0 ? `${count} ${count === 1 ? one : many}` : null

const columns: DataTableColumn<AdminShippingZone, AdminShippingZonesSortKey>[] = [
  {
    key: 'name',
    header: 'Zone',
    sortKey: 'name',
    cell: (zone) => <span className="text-[13.5px] font-medium text-ink">{zone.name}</span>,
  },
  {
    key: 'destinations',
    header: 'Destinations',
    cell: (zone) => {
      const parts = [
        plural(zone.countriesCount ?? 0, 'country', 'countries'),
        plural(zone.regionsCount ?? 0, 'province', 'provinces'),
      ].filter((part): part is string => part !== null)
      return (
        <span className="text-[13px] whitespace-nowrap text-muted">
          {parts.length > 0 ? parts.join(' · ') : 'None yet'}
        </span>
      )
    },
  },
  {
    key: 'rates',
    header: 'Rates',
    align: 'right',
    cell: (zone) => <span className={dataTable.mono}>{zone.ratesCount ?? 0}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (zone) =>
      zone.isActive ? (
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

export default function AdminShippingHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminShippingZonesSortKey>({
    defaultSort: { key: 'name', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminShippingZoneStatusFilter>('active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const list = useAdminShippingZonesInfinite({ ...query, status })
  const archive = useArchiveAdminShippingZone()
  const unarchive = useUnarchiveAdminShippingZone()

  const canCreate = useCan('shipping.create')
  const canEdit = useCan('shipping.edit')
  const canArchive = useCan('shipping.archive')
  const selection = useBulkSelection(['shipping zone', 'shipping zones'])
  const bulkArchive = useBulkSetAdminShippingZonesArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(zone: AdminShippingZone) {
    if (zone.isActive) {
      archive.mutate(zone.id, {
        onSuccess: (saved) => toast.success(`${saved.name} archived`),
        onError,
      })
    } else {
      unarchive.mutate(zone.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Settings"
      title="Shipping"
      description="Group countries into zones and set the shipping rates each zone offers."
      actions={
        canCreate && (
          <FormButton type="button" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={15} /> Add zone
          </FormButton>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search shipping zones"
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
              name="shipping-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminShippingZoneStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All zones' },
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
          label="Shipping zones"
          list={list}
          columns={columns}
          getRowId={(zone) => zone.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (zone) => (
                  <>
                    {canEdit && zone.isActive && (
                      <IconButton
                        label={`Edit ${zone.name}`}
                        size="sm"
                        onClick={() => router.visit(`/admin/shipping/edit/${zone.id}`)}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canArchive && (
                      <IconButton
                        label={zone.isActive ? `Archive ${zone.name}` : `Restore ${zone.name}`}
                        size="sm"
                        disabled={archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(zone)}
                      >
                        {zone.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No shipping zones match your search.' : 'No shipping zones yet.'}
          errorMessage="Could not load shipping zones."
        />
      </section>

      {dialogOpen && <ZoneDialog open onClose={() => setDialogOpen(false)} />}
    </Page>
  )
}

AdminShippingHome.layout = [AdminLayout]
