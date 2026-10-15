import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
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
import { Badge, Dialog, IconButton, SearchInput } from '~/components/ui'
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
import OptionDialog from './_option_dialog'
import {
  useAdminOptionsInfinite,
  useArchiveAdminOption,
  useBulkSetAdminOptionsArchived,
  useUnarchiveAdminOption,
  useExportAdminOptions,
  useImportAdminOptions,
} from './_hooks'
import {
  AdminOptionStatusFilterSchema,
  type AdminOptionListItem,
  type AdminOptionStatusFilter,
  type AdminOptionsSortKey,
  OPTION_IMPORT_COLUMNS,
} from './_types'

const columns: DataTableColumn<AdminOptionListItem, AdminOptionsSortKey>[] = [
  {
    key: 'name',
    header: 'Option',
    sortKey: 'name',
    cell: (option) => (
      <Link
        route="admin.options.edit"
        routeParams={{ id: option.id }}
        className="text-[13.5px] font-medium text-ink hover:underline"
      >
        {option.name}
      </Link>
    ),
  },
  {
    key: 'values',
    header: 'Values',
    align: 'right',
    cell: (option) => <span className={dataTable.mono}>{option.valuesCount ?? 0}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (option) =>
      option.isActive ? (
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

export default function AdminOptionsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminOptionsSortKey>({
    defaultSort: { key: 'name', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminOptionStatusFilter>('active')
  const [creating, setCreating] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<AdminOptionListItem | null>(null)
  const list = useAdminOptionsInfinite({ ...query, status })
  const archive = useArchiveAdminOption()
  const unarchive = useUnarchiveAdminOption()
  const canCreate = useCan('options.create')
  const canTransfer = useCanCsvTransfer('options')
  const exportOptions = useExportAdminOptions()
  const importOptions = useImportAdminOptions()
  const canEdit = useCan('options.edit')
  const canArchive = useCan('options.archive')
  const selection = useBulkSelection(['option', 'options'])
  const bulkArchive = useBulkSetAdminOptionsArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onConfirmArchive() {
    if (!archiveTarget) return
    archive.mutate(archiveTarget.id, {
      onSuccess: (saved) => {
        toast.success(`${saved.name} archived`)
        setArchiveTarget(null)
      },
      onError,
    })
  }

  function onToggleArchive(option: AdminOptionListItem) {
    if (option.isActive) {
      setArchiveTarget(option)
    } else {
      unarchive.mutate(option.id, {
        onSuccess: (saved) => toast.success(`${saved.name} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Catalog"
      title="Product options"
      description="Shared option names and values. Products pick from this catalog instead of typing options by hand."
      actions={
        (canTransfer || canCreate) && (
          <>
            <CsvTransferActions
              resource="options"
              exportMutation={exportOptions}
              exportQuery={{ ...query, status }}
              renderImportDialog={(onClose) => (
                <AdminCsvImportDialog
                  description="Upload a CSV with one option per row. Separate its values with | (for example S|M|L). Names that already exist are skipped."
                  noun={['option', 'options']}
                  sampleHref={urlFor('admin.options.import.sample')}
                  columns={OPTION_IMPORT_COLUMNS}
                  hint="Up to 1,000 rows and 2 MB. Status is active or archived (active when empty)."
                  mutation={importOptions}
                  onClose={onClose}
                />
              )}
            />
            {canCreate && (
              <FormButton type="button" size="sm" onClick={() => setCreating(true)}>
                <Plus size={15} /> Add option
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
              label="Search options"
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
              name="options-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminOptionStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All options' },
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
          label="Product options"
          list={list}
          columns={columns}
          getRowId={(option) => option.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (option) => (
                  <>
                    {canEdit && (
                      <Link
                        route="admin.options.edit"
                        routeParams={{ id: option.id }}
                        aria-label={`Edit ${option.name}`}
                        className="inline-grid size-7 place-items-center rounded-lg border border-line text-muted hover:text-ink"
                      >
                        <Pencil size={15} />
                      </Link>
                    )}
                    {canArchive && (
                      <IconButton
                        label={
                          option.isActive ? `Archive ${option.name}` : `Restore ${option.name}`
                        }
                        size="sm"
                        disabled={archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(option)}
                      >
                        {option.isActive ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No options match your search.' : 'No options yet.'}
          errorMessage="Could not load options."
        />
      </section>

      <OptionDialog open={creating} onClose={() => setCreating(false)} />

      <Dialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        title="Archive option?"
        description={
          archiveTarget ? (
            <>
              Archive <strong className="font-medium text-ink">{archiveTarget.name}</strong>? It
              will no longer appear when configuring products. You can restore it from the archived
              list.
            </>
          ) : null
        }
      >
        <form
          className="flex flex-wrap justify-end gap-2.5"
          onSubmit={(event) => {
            event.preventDefault()
            onConfirmArchive()
          }}
        >
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setArchiveTarget(null)}
          >
            Cancel
          </FormButton>
          <FormButton type="submit" variant="danger" size="sm" loading={archive.isPending}>
            Archive option
          </FormButton>
        </form>
      </Dialog>
    </Page>
  )
}

AdminOptionsHome.layout = [AdminLayout]
