import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Pencil, Plus } from 'lucide-react'
import Page from '~/components/page'
import {
  BulkArchiveActions,
  BulkStatusActions,
  DataTableBulkBar,
  DataTableToolbar,
  InfiniteDataTable,
  type DataTableColumn,
} from '~/components/data_table'
import { FormSelectWithSearch } from '~/components/form'
import { Badge, SearchInput } from '~/components/ui'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../../_hooks'
import { useAdminHelpCategoryOptions } from '../categories/_hooks'
import { helpArticleStatusMeta } from './_format'
import {
  useAdminHelpArticlesInfinite,
  useBulkSetAdminHelpArticlesArchived,
  useBulkSetAdminHelpArticlesStatus,
} from './_hooks'
import {
  AdminHelpArticleStatusFilterSchema,
  type AdminHelpArticleListItem,
  type AdminHelpArticleStatusFilter,
  type AdminHelpArticlesSortKey,
} from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

const columns: DataTableColumn<AdminHelpArticleListItem, AdminHelpArticlesSortKey>[] = [
  {
    key: 'title',
    header: 'Article',
    sortKey: 'title',
    cell: (article) => (
      <div className="min-w-0">
        <Link
          route="admin.help_articles.edit"
          routeParams={{ id: article.id }}
          className="truncate text-[13.5px] font-medium text-ink hover:underline"
        >
          {article.title}
        </Link>
        <div className={`truncate ${dataTable.mono}`}>
          /help/{article.category?.slug ?? '…'}/{article.slug}
        </div>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    cell: (article) => (
      <span className="text-[13px] text-ink-2">{article.category?.title ?? '—'}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortKey: 'status',
    cell: (article) => {
      const meta = helpArticleStatusMeta[article.status]
      return (
        <span className="inline-flex flex-wrap gap-1.5">
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
          {article.popular && <Badge tone="info">Popular</Badge>}
        </span>
      )
    },
  },
  {
    key: 'position',
    header: 'Order',
    sortKey: 'position',
    align: 'right',
    cell: (article) => <span className={dataTable.mono}>{article.position}</span>,
  },
  {
    key: 'updatedAt',
    header: 'Updated',
    sortKey: 'updatedAt',
    cell: (article) => (
      <span className={dataTable.mono}>
        {dateFormat.format(new Date(article.updatedAt ?? article.createdAt))}
      </span>
    ),
  },
]

export default function AdminHelpArticlesHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminHelpArticlesSortKey>({
    defaultSort: { key: 'updatedAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminHelpArticleStatusFilter>('')
  const [categoryId, setCategoryId] = useState('')
  const categories = useAdminHelpCategoryOptions()
  const selection = useBulkSelection(['article', 'articles'])
  const list = useAdminHelpArticlesInfinite({ ...query, status, categoryId })
  const canCreate = useCan('help_articles.create')
  const canEdit = useCan('help_articles.edit')
  const canArchive = useCan('help_articles.archive')
  const bulkStatus = useBulkSetAdminHelpArticlesStatus()
  const bulkArchive = useBulkSetAdminHelpArticlesArchived()
  const bulkDisabled = bulkStatus.isPending || bulkArchive.isPending || selection.tooMany
  const filtered = Boolean(query.q || status || categoryId)
  const selectable = canEdit || canArchive

  return (
    <Page
      eyebrow="Back office · Customer service"
      title="Help center"
      description="Guides shown at /help on the storefront. The help chat answers customers from active articles."
      actions={
        canCreate && (
          <Link route="admin.help_articles.create" className={buttonClasses({ size: 'sm' })}>
            <Plus size={15} /> Add article
          </Link>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search articles"
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
                name="help-articles-category-filter"
                label="Filter by category"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={categoryId}
                isLoading={categories.isLoading}
                onChange={(next) => {
                  setCategoryId(next)
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All categories' },
                  ...(categories.data ?? []).map((category) => ({
                    value: category.id,
                    label: category.title,
                  })),
                ]}
              />
              <FormSelectWithSearch
                name="help-articles-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[9rem] sm:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(AdminHelpArticleStatusFilterSchema.parse(next))
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
          label="Help articles"
          list={list}
          columns={columns}
          getRowId={(article) => article.id}
          sort={sort}
          onSortChange={setSort}
          selectedIds={selectable ? selection.selectedIds : undefined}
          onSelectionChange={selectable ? selection.setSelectedIds : undefined}
          rowActions={
            canEdit
              ? (article) => (
                  <Link
                    route="admin.help_articles.edit"
                    routeParams={{ id: article.id }}
                    className={`${iconButton} size-7 border-transparent`}
                    aria-label={`Edit ${article.title}`}
                    title={`Edit ${article.title}`}
                  >
                    <Pencil size={15} />
                  </Link>
                )
              : undefined
          }
          emptySlot={filtered ? 'No articles match your filters.' : 'No help articles yet.'}
          errorMessage="Could not load help articles."
        />
      </section>
    </Page>
  )
}

AdminHelpArticlesHome.layout = [AdminLayout]
