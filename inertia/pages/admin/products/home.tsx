import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ImageIcon, Pencil, Plus } from 'lucide-react'
import Page from '~/components/page'
import {
  BulkArchiveActions,
  BulkStatusActions,
  InfiniteDataTable,
  DataTableBulkBar,
  DataTableToolbar,
  type DataTableColumn,
} from '~/components/data_table'
import { Badge, SearchInput } from '~/components/ui'
import { FormSelectWithSearch } from '~/components/form'
import { useBulkSelection } from '~/hooks/use_bulk_selection'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import CsvTransferActions, { useCanCsvTransfer } from '../_csv_transfer_actions'
import { useCan } from '../_hooks'
import { formatPriceRange, productStatusMeta } from './_format'
import ImportDialog from './_import_dialog'
import {
  useAdminProductsInfinite,
  useBulkSetAdminProductsArchived,
  useBulkSetAdminProductsStatus,
  useExportAdminProducts,
} from './_hooks'
import {
  AdminProductStatusFilterSchema,
  type AdminProductListItem,
  type AdminProductStatusFilter,
  type AdminProductsSortKey,
} from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

const columns: DataTableColumn<AdminProductListItem, AdminProductsSortKey>[] = [
  {
    key: 'title',
    header: 'Product',
    sortKey: 'title',
    cell: (product) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 flex-none place-items-center overflow-hidden rounded-md border border-line bg-paper text-subtle">
          {product.coverImageUrl ? (
            <img
              src={product.coverImageUrl}
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
        <div className="min-w-0 max-w-[160px] sm:max-w-[280px]">
          <Link
            route="admin.products.edit"
            routeParams={{ id: product.id }}
            className="block truncate text-[13.5px] font-medium text-ink hover:underline"
          >
            {product.title}
          </Link>
          <div className={`truncate ${dataTable.mono}`}>{product.slug}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortKey: 'status',
    cell: (product) => {
      const meta = productStatusMeta[product.status]
      return (
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
      )
    },
  },
  {
    key: 'inventory',
    header: 'Inventory',
    cell: (product) => {
      const variants = product.variantsCount ?? 0
      return (
        <span className="text-[13px]">
          {product.availableTotal ?? 0} in stock
          <span className="text-muted">
            {' '}
            · {variants} {variants === 1 ? 'variant' : 'variants'}
          </span>
        </span>
      )
    },
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    cell: (product) => (
      <div className="flex flex-col items-end gap-1">
        <span className={dataTable.mono}>
          {formatPriceRange(product.priceMin, product.priceMax)}
        </span>
        {product.missingPriceCurrencies.map((currency) => (
          <Badge key={currency} tone="warning">
            Missing {currency} price
          </Badge>
        ))}
      </div>
    ),
  },
  {
    key: 'updatedAt',
    header: 'Updated',
    sortKey: 'updatedAt',
    cell: (product) => (
      <span className={dataTable.mono}>
        {dateFormat.format(new Date(product.updatedAt ?? product.createdAt))}
      </span>
    ),
  },
]

export default function AdminProductsHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminProductsSortKey>({
    defaultSort: { key: 'updatedAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<AdminProductStatusFilter>('active')
  const list = useAdminProductsInfinite({ ...query, status })
  const canCreate = useCan('products.create')
  const canTransfer = useCanCsvTransfer('products')
  const exportProducts = useExportAdminProducts()
  const canEdit = useCan('products.edit')
  const canArchive = useCan('products.archive')
  const selection = useBulkSelection(['product', 'products'])
  const bulkArchive = useBulkSetAdminProductsArchived()
  const bulkStatus = useBulkSetAdminProductsStatus()
  const bulkDisabled = bulkStatus.isPending || bulkArchive.isPending || selection.tooMany
  const selectable = canEdit || canArchive

  return (
    <Page
      eyebrow="Back office · Catalog"
      title="Products"
      description="Everything you sell. Variants hold the price, SKU and stock."
      actions={
        (canTransfer || canCreate) && (
          <>
            <CsvTransferActions
              resource="products"
              exportMutation={exportProducts}
              exportQuery={{ ...query, status }}
              renderImportDialog={(onClose) => <ImportDialog onClose={onClose} />}
            />
            {canCreate && (
              <Link route="admin.products.create" className={buttonClasses({ size: 'sm' })}>
                <Plus size={15} /> Add product
              </Link>
            )}
          </>
        )
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search products"
              placeholder="Search by title, tag or SKU…"
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
              name="products-status-filter"
              label="Filter by status"
              hideLabel
              compact
              className="w-full min-w-[10rem] sm:w-auto"
              value={status}
              onChange={(next) => {
                setStatus(AdminProductStatusFilterSchema.parse(next))
                selection.clear()
              }}
              options={[
                { value: '', label: 'All status' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          }
        />

        {selectable && (
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
        )}

        <InfiniteDataTable
          selectedIds={selectable ? selection.selectedIds : undefined}
          onSelectionChange={selectable ? selection.setSelectedIds : undefined}
          label="Products"
          list={list}
          columns={columns}
          getRowId={(product) => product.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={
            canEdit
              ? (product) => (
                  <Link
                    route="admin.products.edit"
                    routeParams={{ id: product.id }}
                    className={`${iconButton} size-7 border-transparent`}
                    aria-label={`Edit ${product.title}`}
                    title={`Edit ${product.title}`}
                  >
                    <Pencil size={15} />
                  </Link>
                )
              : undefined
          }
          emptySlot={query.q || status ? 'No products match your filters.' : 'No products yet.'}
          errorMessage="Could not load products."
        />
      </section>
    </Page>
  )
}

AdminProductsHome.layout = [AdminLayout]
