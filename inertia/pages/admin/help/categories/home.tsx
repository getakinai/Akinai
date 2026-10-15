import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react'
import Page from '~/components/page'
import {
  BulkArchiveActions,
  DataTableBulkBar,
  DataTableToolbar,
  InfiniteDataTable,
  type DataTableColumn,
} from '~/components/data_table'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { Badge, IconButton, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { card, dataTable, listToolbarSearch } from '~/lib/styles'
import { HelpIcon } from '~/pages/help/_icons'
import { useCan } from '../../_hooks'
import CategoryDialog from './_category_dialog'
import {
  useAdminHelpCategoriesInfinite,
  useArchiveAdminHelpCategory,
  useBulkSetAdminHelpCategoriesArchived,
  useUnarchiveAdminHelpCategory,
} from './_hooks'
import {
  AdminHelpCategoryStatusFilterSchema,
  type AdminHelpCategoriesSortKey,
  type AdminHelpCategory,
  type AdminHelpCategoryStatusFilter,
} from './_types'

type CategoryDialogState = { open: false } | { open: true; category: AdminHelpCategory | null }

const columns: DataTableColumn<AdminHelpCategory, AdminHelpCategoriesSortKey>[] = [
  {
    key: 'title',
    header: 'Category',
    sortKey: 'title',
    cell: (category) => (
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 flex-none place-items-center rounded-md border border-line-2 text-ink-2">
          <HelpIcon name={category.icon} size={15} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-ink">{category.title}</div>
          <div className={`truncate ${dataTable.mono}`}>/help/{category.slug}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'sections',
    header: 'Sections',
    align: 'right',
    cell: (category) => <span className={dataTable.mono}>{category.groups.length}</span>,
  },
  {
    key: 'articles',
    header: 'Articles',
    sortKey: 'articlesCount',
    align: 'right',
    cell: (category) => <span className={dataTable.mono}>{category.articlesCount}</span>,
  },
  {
    key: 'position',
    header: 'Order',
    sortKey: 'position',
    align: 'right',
    cell: (category) => <span className={dataTable.mono}>{category.position}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (category) =>
      category.archivedAt ? (
        <Badge tone="warning" dot>
          Archived
        </Badge>
      ) : (
        <span className="inline-flex flex-wrap gap-1.5">
          <Badge tone="success" dot>
            Active
          </Badge>
          {category.popular && <Badge tone="info">Popular</Badge>}
        </span>
      ),
  },
]

export default function AdminHelpCategoriesHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminHelpCategoriesSortKey>({
    defaultSort: { key: 'position', direction: 'asc' },
  })
  const [status, setStatus] = useState<AdminHelpCategoryStatusFilter>('active')
  const [dialog, setDialog] = useState<CategoryDialogState>({ open: false })
  const list = useAdminHelpCategoriesInfinite({ ...query, status })
  const archive = useArchiveAdminHelpCategory()
  const unarchive = useUnarchiveAdminHelpCategory()

  const canCreate = useCan('help_articles.create')
  const canEdit = useCan('help_articles.edit')
  const canArchive = useCan('help_articles.archive')
  const selection = useBulkSelection(['category', 'categories'])
  const bulkArchive = useBulkSetAdminHelpCategoriesArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(category: AdminHelpCategory) {
    if (category.archivedAt) {
      unarchive.mutate(category.id, {
        onSuccess: (saved) => toast.success(`${saved.title} restored`),
        onError,
      })
    } else {
      archive.mutate(category.id, {
        onSuccess: (saved) => toast.success(`${saved.title} archived`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Customer service"
      title="Help categories"
      description="Topics on the storefront help center. Sections split a category's articles into headed groups."
      actions={
        canCreate && (
          <FormButton
            type="button"
            size="sm"
            onClick={() => setDialog({ open: true, category: null })}
          >
            <Plus size={15} /> Add category
          </FormButton>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search categories"
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
            <FormSelectWithSearch
              name="help-categories-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminHelpCategoryStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
                { value: '', label: 'All categories' },
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
          label="Help categories"
          list={list}
          columns={columns}
          getRowId={(category) => category.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (category) => (
                  <>
                    {canEdit && !category.archivedAt && (
                      <IconButton
                        label={`Edit ${category.title}`}
                        size="sm"
                        onClick={() => setDialog({ open: true, category })}
                      >
                        <Pencil size={15} />
                      </IconButton>
                    )}
                    {canArchive && (
                      <IconButton
                        label={
                          category.archivedAt
                            ? `Restore ${category.title}`
                            : `Archive ${category.title}`
                        }
                        size="sm"
                        disabled={archive.isPending || unarchive.isPending}
                        onClick={() => onToggleArchive(category)}
                      >
                        {category.archivedAt ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                      </IconButton>
                    )}
                  </>
                )
              : undefined
          }
          emptySlot={query.q ? 'No categories match your search.' : 'No categories yet.'}
          errorMessage="Could not load help categories."
        />
      </section>

      {dialog.open && (
        <CategoryDialog
          key={dialog.category?.id ?? 'new'}
          open
          category={dialog.category}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </Page>
  )
}

AdminHelpCategoriesHome.layout = [AdminLayout]
