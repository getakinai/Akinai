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
  discountStatusMeta,
  discountTypeMeta,
  formatDiscountPeriod,
  formatDiscountValue,
} from './_format'
import DiscountTypeDialog from './_type_dialog'
import {
  useAdminDiscountsInfinite,
  useArchiveAdminDiscount,
  useBulkSetAdminDiscountsArchived,
  useUnarchiveAdminDiscount,
} from './_hooks'
import {
  AdminDiscountStatusFilterSchema,
  AdminDiscountTypeFilterSchema,
  DISCOUNT_TYPES,
  type AdminDiscount,
  type AdminDiscountStatusFilter,
  type AdminDiscountTypeFilter,
  type AdminDiscountsSortKey,
} from './_types'

const columns: DataTableColumn<AdminDiscount, AdminDiscountsSortKey>[] = [
  {
    key: 'title',
    header: 'Discount',
    sortKey: 'title',
    cell: (discount) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[13.5px] font-medium text-ink">{discount.title}</span>
        <span className={dataTable.mono}>{discount.code ?? 'Automatic'}</span>
        <span className="truncate text-[12px] text-muted">
          {discountTypeMeta[discount.type].label}
        </span>
      </div>
    ),
  },
  {
    key: 'value',
    header: 'Value',
    cell: (discount) => formatDiscountValue(discount),
  },
  {
    key: 'period',
    header: 'Active dates',
    sortKey: 'startsAt',
    cell: (discount) => <span className={dataTable.mono}>{formatDiscountPeriod(discount)}</span>,
  },
  {
    key: 'used',
    header: 'Used',
    align: 'right',
    cell: (discount) => (
      <span className={dataTable.mono}>
        {discount.usageCount}
        {discount.usageLimit !== null && ` / ${discount.usageLimit}`}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (discount) => {
      const meta = discountStatusMeta[discount.status]
      return (
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
      )
    },
  },
]

export default function AdminDiscountsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminDiscountsSortKey>({
    defaultSort: { key: 'createdAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminDiscountStatusFilter>('')
  const [type, setType] = useState<AdminDiscountTypeFilter>('')
  const [choosingType, setChoosingType] = useState(false)
  const list = useAdminDiscountsInfinite({ ...query, status, type })
  const archive = useArchiveAdminDiscount()
  const unarchive = useUnarchiveAdminDiscount()

  const canCreate = useCan('discounts.create')
  const canEdit = useCan('discounts.edit')
  const canArchive = useCan('discounts.archive')
  const selection = useBulkSelection(['discount', 'discounts'])
  const bulkArchive = useBulkSetAdminDiscountsArchived()
  const bulkDisabled = bulkArchive.isPending || selection.tooMany

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive(discount: AdminDiscount) {
    if (discount.status !== 'archived') {
      archive.mutate(discount.id, {
        onSuccess: (saved) => toast.success(`${saved.title} archived`),
        onError,
      })
    } else {
      unarchive.mutate(discount.id, {
        onSuccess: (saved) => toast.success(`${saved.title} restored`),
        onError,
      })
    }
  }

  return (
    <Page
      eyebrow="Back office · Marketing"
      title="Discounts"
      description="Discount codes and automatic discounts that take money off orders."
      actions={
        canCreate && (
          <FormButton type="button" size="sm" onClick={() => setChoosingType(true)}>
            <Plus size={15} /> Create discount
          </FormButton>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search discounts"
              placeholder="Search by title or code…"
              value={query.q}
              onDebouncedChange={(next) => {
                setSearch(next)
                selection.clear()
              }}
              className={listToolbarSearch}
            />
          }
          right={
            <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
              <FormSelectWithSearch
                name="discounts-type-filter"
                label="Filter by type"
                hideLabel
                compact
                className="w-full min-w-[12rem] sm:w-auto"
                value={type}
                onChange={(next) => {
                  setType(AdminDiscountTypeFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All types' },
                  ...DISCOUNT_TYPES.map((value) => ({
                    value,
                    label: discountTypeMeta[value].label,
                  })),
                ]}
              />
              <FormSelectWithSearch
                name="discounts-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[10rem] sm:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(AdminDiscountStatusFilterSchema.parse(next))
                  selection.clear()
                }}
                options={[
                  { value: '', label: 'All discounts' },
                  { value: 'active', label: 'Active' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
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
          label="Discounts"
          list={list}
          columns={columns}
          getRowId={(discount) => discount.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit || canArchive
              ? (discount) => {
                  const archived = discount.status === 'archived'
                  return (
                    <>
                      {canEdit && !archived && (
                        <IconButton
                          label={`Edit ${discount.title}`}
                          size="sm"
                          onClick={() => router.visit(`/admin/discounts/edit/${discount.id}`)}
                        >
                          <Pencil size={15} />
                        </IconButton>
                      )}
                      {canArchive && (
                        <IconButton
                          label={
                            archived ? `Restore ${discount.title}` : `Archive ${discount.title}`
                          }
                          size="sm"
                          disabled={archive.isPending || unarchive.isPending}
                          onClick={() => onToggleArchive(discount)}
                        >
                          {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                        </IconButton>
                      )}
                    </>
                  )
                }
              : undefined
          }
          emptySlot={query.q ? 'No discounts match your search.' : 'No discounts yet.'}
          errorMessage="Could not load discounts."
        />
      </section>
      {canCreate && (
        <DiscountTypeDialog open={choosingType} onClose={() => setChoosingType(false)} />
      )}
    </Page>
  )
}

AdminDiscountsHome.layout = [AdminLayout]
