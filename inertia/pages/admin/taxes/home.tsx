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
import { Badge, IconButton, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { countryName } from '~/lib/countries'
import { HttpError } from '~/lib/http'
import { card, dataTable, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useAdminTaxRatesInfinite,
  useArchiveAdminTaxRate,
  useBulkSetAdminTaxRatesArchived,
  useUnarchiveAdminTaxRate,
} from './_hooks'
import TaxRateDialog from './_tax_rate_dialog'
import {
  AdminTaxRateStatusFilterSchema,
  type AdminTaxRate,
  type AdminTaxRateStatusFilter,
  type AdminTaxRatesSortKey,
} from './_types'

type TaxRateDialogState = { open: false } | { open: true; taxRate: AdminTaxRate | null }

const percentFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 })

const columns: DataTableColumn<AdminTaxRate, AdminTaxRatesSortKey>[] = [
  {
    key: 'name',
    header: 'Tax',
    sortKey: 'name',
    cell: (taxRate) => <span className="text-[13.5px] font-medium text-ink">{taxRate.name}</span>,
  },
  {
    key: 'country',
    header: 'Applies in',
    sortKey: 'countryCode',
    cell: (taxRate) => (
      <span>
        {countryName(taxRate.countryCode)}
        {taxRate.regionCode ? (
          <span className={`${dataTable.mono} ml-1.5`}>{taxRate.regionCode}</span>
        ) : (
          <span className="ml-1.5 text-muted">· Country-wide</span>
        )}
      </span>
    ),
  },
  {
    key: 'rate',
    header: 'Rate',
    sortKey: 'rate',
    align: 'right',
    cell: (taxRate) => (
      <span className={dataTable.mono}>{percentFormat.format(taxRate.rate)}%</span>
    ),
  },
  {
    key: 'shipping',
    header: 'Shipping',
    cell: (taxRate) => (taxRate.appliesToShipping ? 'Taxed' : 'Not taxed'),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (taxRate) =>
      taxRate.isActive ? (
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

export default function AdminTaxesHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminTaxRatesSortKey>({
    defaultSort: { key: 'countryCode', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminTaxRateStatusFilter>('active')
  const [dialog, setDialog] = useState<TaxRateDialogState>({ open: false })
  const list = useAdminTaxRatesInfinite({ ...query, status })
  const archive = useArchiveAdminTaxRate()
  const unarchive = useUnarchiveAdminTaxRate()

  const canCreate = useCan('taxes.create')
  const canEdit = useCan('taxes.edit')
  const canArchive = useCan('taxes.archive')
  const selection = useBulkSelection(['tax rate', 'tax rates'])
  const bulkArchive = useBulkSetAdminTaxRatesArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(taxRate: AdminTaxRate) {
    if (taxRate.isActive) {
      archive.mutate(taxRate.id, {
        onSuccess: (saved) => toast.success(`${saved.name} archived`),
        onError,
      })
    } else {
      unarchive.mutate(taxRate.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Settings"
      title="Taxes"
      description="Tax rates charged on orders, by country and optionally by region."
      actions={
        canCreate && (
          <FormButton
            type="button"
            size="sm"
            onClick={() => setDialog({ open: true, taxRate: null })}
          >
            <Plus size={15} /> Add tax rate
          </FormButton>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search tax rates"
              placeholder="Search by name, country or region code…"
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
              name="taxes-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminTaxRateStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All tax rates' },
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
          label="Tax rates"
          list={list}
          columns={columns}
          getRowId={(taxRate) => taxRate.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (taxRate) => (
                  <>
                    {canEdit && taxRate.isActive && (
                      <IconButton
                        label={`Edit ${taxRate.name}`}
                        size="sm"
                        onClick={() => setDialog({ open: true, taxRate })}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canArchive && (
                      <IconButton
                        label={
                          taxRate.isActive ? `Archive ${taxRate.name}` : `Restore ${taxRate.name}`
                        }
                        size="sm"
                        disabled={archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(taxRate)}
                      >
                        {taxRate.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No tax rates match your search.' : 'No tax rates yet.'}
          errorMessage="Could not load tax rates."
        />
      </section>

      {dialog.open && (
        <TaxRateDialog
          key={dialog.taxRate?.id ?? 'new'}
          open
          taxRate={dialog.taxRate}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </Page>
  )
}

AdminTaxesHome.layout = [AdminLayout]
