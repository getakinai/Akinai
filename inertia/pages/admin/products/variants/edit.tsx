import { useState } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Boxes, Trash2 } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card } from '~/lib/styles'
import { useCan } from '../../_hooks'
import DeleteVariantDialog from '../_delete_variant_dialog'
import { useAdminProduct, useAdminVariant, useUpdateAdminVariant } from '../_hooks'
import InventoryDialog from '../_inventory_dialog'
import VariantForm from './_variant_form'
import VariantPageMessage from './_variant_page_message'

type AdminVariantsEditProps = {
  productId: string
  id: string
}

export default function AdminVariantsEdit({ productId, id }: AdminVariantsEditProps) {
  const product = useAdminProduct(productId)
  const variant = useAdminVariant(productId, id)
  const updateVariant = useUpdateAdminVariant()
  const canEdit = useCan('products.edit')
  const canEditInventory = useCan('inventory.edit')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [deleting, setDeleting] = useState(false)
  const [editingStock, setEditingStock] = useState(false)
  const backToProduct = () => router.visit(`/admin/products/edit/${productId}`)

  const isLoading = product.isLoading || variant.isLoading
  const isError = product.isError || variant.isError
  const isArchived = product.data?.status === 'archived'
  const editable = canEdit && !isArchived
  const isLastVariant = (product.data?.variants.length ?? 0) <= 1

  return (
    <Page
      eyebrow={
        <Link
          route="admin.products.edit"
          routeParams={{ id: productId }}
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> {product.data?.title ?? 'Product'}
        </Link>
      }
      title={variant.data?.title ?? 'Variant'}
      description={variant.data?.sku ? `SKU ${variant.data.sku}` : undefined}
    >
      {isLoading ? (
        <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !product.data || !variant.data ? (
        <VariantPageMessage
          productId={productId}
          onRetry={() => {
            product.refetch()
            variant.refetch()
          }}
        >
          Could not load this variant.
        </VariantPageMessage>
      ) : (
        <div className="flex flex-col gap-6">
          {isArchived && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This product is archived. Unarchive it to change its variants.
            </p>
          )}

          <VariantForm
            key={`${variant.data.id}-${variant.data.updatedAt ?? ''}`}
            product={product.data}
            variant={variant.data}
            editable={editable}
            pending={updateVariant.isPending}
            submitLabel="Save variant"
            errors={errors}
            setErrors={setErrors}
            onCancel={backToProduct}
            onSubmit={(data) =>
              updateVariant.mutate(
                { productId, id, ...data },
                {
                  onSuccess: (saved) => toast.success(`${saved.title} saved`),
                  onError: (error) => handleMutationError(error, setErrors),
                }
              )
            }
            footerStart={
              editable && (
                <FormButton
                  type="button"
                  variant="secondary"
                  disabled={isLastVariant}
                  title={isLastVariant ? 'A product needs at least one variant' : undefined}
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 size={15} /> Delete
                </FormButton>
              )
            }
          />

          <section className={card.base}>
            <header className={card.head}>
              <div>
                <span className={card.eyebrow}>Stock</span>
                <h2 className={card.title}>
                  {variant.data.trackInventory
                    ? `${variant.data.availableTotal} available`
                    : 'Not tracked'}
                </h2>
              </div>
              {variant.data.trackInventory && canEditInventory && !isArchived && (
                <FormButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingStock(true)}
                >
                  <Boxes size={15} /> Edit stock
                </FormButton>
              )}
            </header>
            {variant.data.trackInventory ? (
              <ul className="flex flex-col divide-y divide-line">
                {variant.data.inventory.map((row) => (
                  <li
                    key={row.locationId}
                    className="flex justify-between py-2.5 text-[13.5px] text-ink-2"
                  >
                    <span>{row.locationName}</span>
                    <span className="tabular-nums">{row.available}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-muted">
                Turn on inventory tracking and save to manage stock for this variant.
              </p>
            )}
          </section>

          {editingStock && (
            <InventoryDialog variant={variant.data} onClose={() => setEditingStock(false)} />
          )}
          <DeleteVariantDialog
            variant={deleting ? variant.data : null}
            onClose={() => setDeleting(false)}
            onDeleted={backToProduct}
          />
        </div>
      )}
    </Page>
  )
}

AdminVariantsEdit.layout = [AdminLayout]
