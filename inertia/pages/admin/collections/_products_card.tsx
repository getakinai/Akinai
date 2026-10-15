import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { DataTableLoadMore } from '~/components/data_table'
import { FormButton } from '~/components/form'
import { Badge, IconButton, Skeleton } from '~/components/ui'
import { HttpError } from '~/lib/http'
import { card } from '~/lib/styles'
import { formatPriceRange, productStatusMeta } from '../products/_format'
import AddProductsDialog from './_add_products_dialog'
import { sortOrderLabels } from './_format'
import {
  useAdminCollectionProductsInfinite,
  useMoveAdminCollectionProduct,
  useRemoveAdminCollectionProduct,
} from './_hooks'
import { type AdminCollection } from './_types'

type ProductsCardProps = {
  collection: AdminCollection
  editable: boolean
}

/**
 * Manual collections list their hand-picked products with add, remove and
 * move controls. Automated collections show the products their conditions
 * currently match.
 */
export default function ProductsCard({ collection, editable }: ProductsCardProps) {
  const [adding, setAdding] = useState(false)
  const list = useAdminCollectionProductsInfinite(collection.id)
  const remove = useRemoveAdminCollectionProduct()
  const move = useMoveAdminCollectionProduct()

  const isManual = collection.type === 'manual'
  const canEditProducts = editable && isManual
  const canReorder = canEditProducts && collection.sortOrder === 'manual'
  const total = list.data ? list.total : collection.productsCount

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onMove(productId: string, position: number) {
    move.mutate({ id: collection.id, productId, position }, { onError })
  }

  function onRemove(productId: string, title: string) {
    remove.mutate(
      { id: collection.id, productId },
      { onSuccess: () => toast.success(`${title} removed`), onError }
    )
  }

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div className="min-w-0">
          <div className={card.eyebrow}>
            {total} {total === 1 ? 'product' : 'products'} · {sortOrderLabels[collection.sortOrder]}
          </div>
          <h2 className={card.title}>Products</h2>
          <p className="mt-1 text-[13px] text-pretty text-muted">
            {isManual
              ? canReorder
                ? 'Use the arrows to set the order shoppers see.'
                : 'Products are ordered by the sort option above.'
              : 'Matched by the conditions above. Archived products are left out.'}
          </p>
        </div>
        {canEditProducts && (
          <FormButton type="button" variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus size={15} /> Add products
          </FormButton>
        )}
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : list.isError && list.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-[14px] text-muted">Could not load products.</span>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => list.refetch()}>
            Try again
          </FormButton>
        </div>
      ) : list.rows.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-muted">
          {isManual
            ? 'No products yet. Add products to start curating this collection.'
            : 'No products match these conditions yet.'}
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {list.rows.map((product, position) => {
            const status = productStatusMeta[product.status]
            return (
              <li key={product.id} className="flex min-w-0 items-center gap-3 py-2.5">
                {canReorder && (
                  <span className="w-6 shrink-0 text-right font-mono text-[12px] text-subtle">
                    {position + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    route="admin.products.edit"
                    routeParams={{ id: product.id }}
                    className="block truncate text-[13.5px] font-medium text-ink hover:underline"
                  >
                    {product.title}
                  </Link>
                  <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    {product.status !== 'active' && (
                      <Badge tone={status.tone} dot>
                        {status.label}
                      </Badge>
                    )}
                    <span className="truncate font-mono text-[12px] text-muted">
                      {formatPriceRange(product.priceMin, product.priceMax)}
                    </span>
                  </div>
                </div>
                {canEditProducts && (
                  <div className="flex shrink-0 items-center gap-1">
                    {canReorder && (
                      <>
                        <IconButton
                          label={`Move ${product.title} up`}
                          size="sm"
                          disabled={position === 0 || move.isPending}
                          onClick={() => onMove(product.id, position - 1)}
                        >
                          <ArrowUp size={15} />
                        </IconButton>
                        <IconButton
                          label={`Move ${product.title} down`}
                          size="sm"
                          disabled={position >= total - 1 || move.isPending}
                          onClick={() => onMove(product.id, position + 1)}
                        >
                          <ArrowDown size={15} />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      label={`Remove ${product.title}`}
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => onRemove(product.id, product.title)}
                    >
                      <X size={15} />
                    </IconButton>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {list.rows.length > 0 && (
        <DataTableLoadMore
          loaded={list.rows.length}
          total={list.total}
          hasMore={list.hasNextPage}
          isLoadingMore={list.isFetchingNextPage}
          isError={list.isFetchNextPageError}
          onLoadMore={() => list.fetchNextPage()}
        />
      )}

      {canEditProducts && (
        <AddProductsDialog
          collectionId={collection.id}
          open={adding}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  )
}
