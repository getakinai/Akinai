import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Plus } from 'lucide-react'
import { buttonClasses, card, cn, dataTable } from '~/lib/styles'
import { useWeightUnit } from '~/pages/_hooks'
import DeleteVariantDialog from './_delete_variant_dialog'
import InventoryDialog from './_inventory_dialog'
import VariantRow from './_variant_row'
import { type AdminProductDetail, type AdminVariant } from './_types'

type VariantsTableProps = {
  product: AdminProductDetail
  editable: boolean
  canEditInventory: boolean
}

export default function VariantsTable({ product, editable, canEditInventory }: VariantsTableProps) {
  const weightUnit = useWeightUnit()
  const headers = ['Variant', 'SKU', 'Barcode', `Weight (${weightUnit})`, 'Inventory', 'Stock', '']
  const [inventoryVariantId, setInventoryVariantId] = useState<string | null>(null)
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null)
  const inventoryVariant = product.variants.find(({ id }) => id === inventoryVariantId) ?? null
  const deleteVariant = product.variants.find(({ id }) => id === deleteVariantId) ?? null
  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Variants</span>
          <h2 className={card.title}>
            {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
          </h2>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
          <span className="text-[13px] text-pretty text-muted max-[900px]:hidden">
            SKU and stock are set per variant. Set prices in Market prices above.
          </span>
          {editable && (
            <Link
              route="admin.products.variants.create"
              routeParams={{ productId: product.id }}
              className={buttonClasses({ variant: 'primary', size: 'sm' })}
            >
              <Plus size={15} /> Add variant
            </Link>
          )}
        </div>
      </header>

      <div className={dataTable.scroller}>
        <table className={dataTable.table} aria-label="Variants">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th
                  key={header || index}
                  className={cn(dataTable.th, index === headers.length - 1 && 'text-right')}
                >
                  {header || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant: AdminVariant) => (
              <VariantRow
                key={`${variant.id}-${variant.updatedAt ?? ''}`}
                variant={variant}
                weightUnit={weightUnit}
                editable={editable}
                canEditInventory={canEditInventory}
                canDelete={product.variants.length > 1}
                onEditInventory={({ id }) => setInventoryVariantId(id)}
                onDelete={({ id }) => setDeleteVariantId(id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {inventoryVariant && (
        <InventoryDialog
          key={inventoryVariant.id}
          variant={inventoryVariant}
          onClose={() => setInventoryVariantId(null)}
        />
      )}
      <DeleteVariantDialog variant={deleteVariant} onClose={() => setDeleteVariantId(null)} />
    </section>
  )
}
