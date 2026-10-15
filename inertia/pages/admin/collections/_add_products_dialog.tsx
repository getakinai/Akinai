import { useState } from 'react'
import { toast } from 'sonner'
import { FormButton } from '~/components/form'
import { Checkbox, Dialog, SearchInput } from '~/components/ui'
import { handleMutationError } from '~/lib/form'
import { cn } from '~/lib/styles'
import { formatPriceRange, productStatusMeta } from '../products/_format'
import { useAdminProducts } from '../products/_hooks'
import { useAddAdminCollectionProducts } from './_hooks'

type AddProductsDialogProps = {
  collectionId: string
  open: boolean
  onClose: () => void
}

const SEARCH_PAGE_SIZE = 25

/**
 * Search the catalog and add the ticked products to a manual collection.
 * Products already in the collection are skipped by the server.
 */
export default function AddProductsDialog({ collectionId, open, onClose }: AddProductsDialogProps) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const addProducts = useAddAdminCollectionProducts()
  const { data, isLoading, isError } = useAdminProducts({
    q,
    status: '',
    sort: 'title',
    direction: 'asc',
    page: 1,
    perPage: SEARCH_PAGE_SIZE,
  })

  const products = (data?.data ?? []).filter((product) => product.status !== 'archived')

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    )
  }

  function close() {
    setSelected([])
    setQ('')
    onClose()
  }

  function onAdd() {
    addProducts.mutate(
      { id: collectionId, productIds: selected },
      {
        onSuccess: ({ added }) => {
          toast.success(
            added === 0
              ? 'Those products are already in this collection'
              : `${added} ${added === 1 ? 'product' : 'products'} added`
          )
          close()
        },
        onError: (error) => handleMutationError(error, () => {}),
      }
    )
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add products"
      description="Search by title or SKU, then tick the products to add."
      className="w-[min(560px,calc(100vw-2rem))]"
    >
      <SearchInput
        label="Search products"
        placeholder="Search products…"
        value={q}
        onDebouncedChange={setQ}
        autoFocus
      />
      <div className="max-h-[50vh] min-h-[160px] overflow-y-auto rounded-lg border border-line">
        {isLoading ? (
          <p className="p-4 text-[13px] text-muted">Loading products…</p>
        ) : isError ? (
          <p className="p-4 text-[13px] text-danger">Could not load products.</p>
        ) : products.length === 0 ? (
          <p className="p-4 text-[13px] text-muted">No products match your search.</p>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((product) => {
              const checked = selected.includes(product.id)
              const status = productStatusMeta[product.status]
              return (
                <li key={product.id}>
                  <label
                    className={cn(
                      'flex min-w-0 cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-paper',
                      checked && 'bg-accent-soft/50'
                    )}
                  >
                    <Checkbox checked={checked} onChange={() => toggle(product.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-ink">{product.title}</span>
                      <span className="block truncate font-mono text-[11.5px] text-muted">
                        {status.label} · {formatPriceRange(product.priceMin, product.priceMax)}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-muted">{selected.length} selected</span>
        <div className="flex flex-wrap gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={close}>
            Cancel
          </FormButton>
          <FormButton
            type="button"
            size="sm"
            disabled={selected.length === 0}
            loading={addProducts.isPending}
            onClick={onAdd}
          >
            Add {selected.length > 0 ? selected.length : ''}{' '}
            {selected.length === 1 ? 'product' : 'products'}
          </FormButton>
        </div>
      </div>
    </Dialog>
  )
}
