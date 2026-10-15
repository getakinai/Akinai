import { useState } from 'react'
import { X } from 'lucide-react'
import { FormButton, FormSelectWithSearch } from '~/components/form'
import { IconButton } from '~/components/ui'
import CollectionPickerDialog from './_collection_picker_dialog'
import ProductPickerDialog from './_product_picker_dialog'
import { DiscountAppliesToSchema, type DiscountAppliesTo, type DiscountTargetItem } from './_types'

type TargetFieldProps = {
  name: string
  label: string
  appliesTo: DiscountAppliesTo
  onAppliesToChange: (next: DiscountAppliesTo) => void
  products: DiscountTargetItem[]
  onProductsChange: (items: DiscountTargetItem[]) => void
  collections: DiscountTargetItem[]
  onCollectionsChange: (items: DiscountTargetItem[]) => void
  disabled?: boolean
  error?: string
}

/**
 * "Specific products" or "Specific collections", with a picker dialog and
 * the chosen items listed underneath.
 */
export default function TargetField({
  name,
  label,
  appliesTo,
  onAppliesToChange,
  products,
  onProductsChange,
  collections,
  onCollectionsChange,
  disabled = false,
  error,
}: TargetFieldProps) {
  const [open, setOpen] = useState(false)
  const byProduct = appliesTo === 'products'
  const items = byProduct ? products : collections
  const setItems = byProduct ? onProductsChange : onCollectionsChange

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormSelectWithSearch
          name={`${name}-appliesTo`}
          label={label}
          className="min-w-0 flex-1"
          value={appliesTo}
          disabled={disabled}
          onChange={(next) => onAppliesToChange(DiscountAppliesToSchema.parse(next))}
          options={[
            { value: 'products', label: 'Specific products' },
            { value: 'collections', label: 'Specific collections' },
          ]}
        />
        {!disabled && (
          <FormButton type="button" variant="secondary" onClick={() => setOpen(true)}>
            Browse
          </FormButton>
        )}
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {items.map((item) => (
            <li key={item.id} className="flex min-w-0 items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{item.title}</span>
              {!disabled && (
                <IconButton
                  label={`Remove ${item.title}`}
                  size="sm"
                  onClick={() => setItems(items.filter(({ id }) => id !== item.id))}
                >
                  <X size={14} />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted">
          No {byProduct ? 'products' : 'collections'} chosen yet.
        </p>
      )}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}

      {open &&
        (byProduct ? (
          <ProductPickerDialog
            open
            onClose={() => setOpen(false)}
            selected={products}
            onDone={(next) => {
              onProductsChange(next)
              setOpen(false)
            }}
          />
        ) : (
          <CollectionPickerDialog
            open
            onClose={() => setOpen(false)}
            selected={collections}
            onDone={(next) => {
              onCollectionsChange(next)
              setOpen(false)
            }}
          />
        ))}
    </div>
  )
}
