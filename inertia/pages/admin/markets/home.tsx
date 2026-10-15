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
  useAdminMarketsInfinite,
  useArchiveAdminMarket,
  useBulkSetAdminMarketsArchived,
  useUnarchiveAdminMarket,
} from './_hooks'
import MarketDialog from './_market_dialog'
import {
  AdminMarketStatusFilterSchema,
  type AdminMarket,
  type AdminMarketStatusFilter,
  type AdminMarketsSortKey,
} from './_types'

const columns: DataTableColumn<AdminMarket, AdminMarketsSortKey>[] = [
  {
    key: 'name',
    header: 'Market',
    sortKey: 'name',
    cell: (market) => (
      <div className="flex items-center gap-2">
        <span className="text-[13.5px] font-medium text-ink">{market.name}</span>
        {market.isPrimary && <Badge tone="info">Primary</Badge>}
      </div>
    ),
  },
  {
    key: 'currency',
    header: 'Currency',
    cell: (market) => <span className={dataTable.mono}>{market.currencyCode}</span>,
  },
  {
    key: 'countries',
    header: 'Countries',
    align: 'right',
    cell: (market) => <span className={dataTable.mono}>{market.countriesCount ?? 0}</span>,
  },
  {
    key: 'tax',
    header: 'Prices',
    cell: (market) => (market.pricesIncludeTax ? 'Include tax' : 'Exclude tax'),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (market) =>
      market.isActive ? (
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

export default function AdminMarketsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminMarketsSortKey>({
    defaultSort: { key: 'name', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminMarketStatusFilter>('active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const list = useAdminMarketsInfinite({ ...query, status })
  const archive = useArchiveAdminMarket()
  const unarchive = useUnarchiveAdminMarket()

  const canCreate = useCan('markets.create')
  const canEdit = useCan('markets.edit')
  const canArchive = useCan('markets.archive')
  const selection = useBulkSelection(['market', 'markets'])
  const bulkArchive = useBulkSetAdminMarketsArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(market: AdminMarket) {
    if (market.isActive) {
      archive.mutate(market.id, {
        onSuccess: (saved) => toast.success(`${saved.name} archived`),
        onError,
      })
    } else {
      unarchive.mutate(market.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Settings"
      title="Markets"
      description="Group the countries you sell to and choose the currency each group pays in."
      actions={
        canCreate && (
          <FormButton type="button" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={15} /> Add market
          </FormButton>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search markets"
              placeholder="Search by name, handle or currency…"
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
              name="markets-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminMarketStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All markets' },
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
          label="Markets"
          list={list}
          columns={columns}
          getRowId={(market) => market.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (market) => (
                  <>
                    {canEdit && market.isActive && (
                      <IconButton
                        label={`Edit ${market.name}`}
                        size="sm"
                        onClick={() => router.visit(`/admin/markets/edit/${market.id}`)}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canArchive && (
                      <IconButton
                        label={
                          market.isPrimary
                            ? 'The primary market cannot be archived'
                            : market.isActive
                              ? `Archive ${market.name}`
                              : `Restore ${market.name}`
                        }
                        size="sm"
                        disabled={market.isPrimary || archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(market)}
                      >
                        {market.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No markets match your search.' : 'No markets yet.'}
          errorMessage="Could not load markets."
        />
      </section>

      {dialogOpen && <MarketDialog open onClose={() => setDialogOpen(false)} />}
    </Page>
  )
}

AdminMarketsHome.layout = [AdminLayout]
