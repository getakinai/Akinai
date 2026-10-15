import { useState } from 'react'
import { FormButton } from '~/components/form'
import { Badge, Checkbox, Dialog, SearchInput, Skeleton } from '~/components/ui'
import { cn } from '~/lib/styles'
import { formatMoney, variantLabel, variantTitle } from '../_format'
import { useOrderVariants } from '../_hooks'
import { type OrderVariantOption } from '../_types'

type VariantPickerDialogProps = {
  open: boolean
  onClose: () => void
  currencyCode: string
  addedIds: string[]
  onAdd: (variants: OrderVariantOption[]) => void
}

export default function VariantPickerDialog({
  open,
  onClose,
  currencyCode,
  addedIds,
  onAdd,
}: VariantPickerDialogProps) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Map<string, OrderVariantOption>>(new Map())
  const { data: variants, isLoading, isError, isFetching } = useOrderVariants(q, open)

  const toggle = (variant: OrderVariantOption) =>
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(variant.id)) next.delete(variant.id)
      else next.set(variant.id, variant)
      return next
    })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add products"
      description="Search by product name, variant or SKU."
      className="w-[min(560px,calc(100vw-24px))]"
    >
      <SearchInput label="Search products" value={q} onDebouncedChange={setQ} autoFocus />

      <div
        className={cn(
          'max-h-[50vh] min-h-40 overflow-y-auto rounded-lg border border-line',
          isFetching && !isLoading && 'opacity-70'
        )}
      >
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <p className="px-4 py-10 text-center text-[13.5px] text-muted">
            Could not load products.
          </p>
        ) : !variants || variants.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13.5px] text-muted">
            {q ? 'No products match your search.' : 'No active products yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {variants.map((variant) => {
              const added = addedIds.includes(variant.id)
              const outOfStock = variant.available !== null && variant.available <= 0
              return (
                <li key={variant.id}>
                  <label
                    className={cn(
                      'flex min-w-0 items-center gap-3 px-3 py-2.5',
                      added ? 'cursor-not-allowed opacity-55' : 'cursor-pointer hover:bg-paper'
                    )}
                  >
                    <Checkbox
                      checked={added || selected.has(variant.id)}
                      disabled={added}
                      onChange={() => toggle(variant)}
                      aria-label={variantLabel({
                        productTitle: variant.productTitle,
                        variantTitle: variant.title,
                      })}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">
                        {variant.productTitle}
                      </span>
                      <span className="block truncate text-[12.5px] text-muted">
                        {[variantTitle(variant.title), variant.sku].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[13.5px] text-ink">
                        {formatMoney(variant.price, currencyCode)}
                      </span>
                      {added ? (
                        <Badge tone="neutral">Added</Badge>
                      ) : variant.available !== null ? (
                        <Badge tone={outOfStock ? 'danger' : 'neutral'}>
                          {variant.available} available
                        </Badge>
                      ) : null}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2.5">
        <FormButton type="button" variant="secondary" onClick={onClose}>
          Cancel
        </FormButton>
        <FormButton
          type="button"
          disabled={selected.size === 0}
          onClick={() => {
            onAdd([...selected.values()])
            onClose()
          }}
        >
          {selected.size > 0 ? `Add ${selected.size}` : 'Add'}
        </FormButton>
      </div>
    </Dialog>
  )
}
