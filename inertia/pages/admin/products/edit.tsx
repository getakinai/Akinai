import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { useIsMutating } from '@tanstack/react-query'
import { Archive, ArchiveRestore, ArrowLeft, Save } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Badge, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import DetailsCard from './_details_card'
import { productStatusMeta } from './_format'
import {
  adminProductsKeys,
  useArchiveAdminProduct,
  useAdminProduct,
  useUnarchiveAdminProduct,
} from './_hooks'
import OptionsCard from './_options_card'
import PricingCard from './_pricing_card'
import ReviewsCard from './_reviews_card'
import VariantsTable from './_variants_table'

const PRODUCT_FORM_ID = 'product-edit-form'

function EditSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading product">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className={`${card.base} flex flex-col gap-3`}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export default function AdminProductsEdit({ id }: { id: string }) {
  const { data: product, isLoading, isError, refetch } = useAdminProduct(id)
  const archive = useArchiveAdminProduct()
  const unarchive = useUnarchiveAdminProduct()
  const canEdit = useCan('products.edit')
  const canArchive = useCan('products.archive')
  const canEditInventory = useCan('inventory.edit')

  const saving = useIsMutating({ mutationKey: adminProductsKeys.update })
  const [mediaBusy, setMediaBusy] = useState(false)

  const isArchived = product?.status === 'archived'
  const editable = canEdit && !isArchived

  function onError(error: unknown) {
    toast.error(error instanceof HttpError ? error.message : 'Something went wrong')
  }

  function onToggleArchive() {
    if (!product) return
    if (isArchived) {
      unarchive.mutate(product.id, {
        onSuccess: (saved) => toast.success(`${saved.title} restored as active`),
        onError,
      })
    } else {
      archive.mutate(product.id, {
        onSuccess: (saved) => toast.success(`${saved.title} archived`),
        onError,
      })
    }
  }

  const status = product ? productStatusMeta[product.status] : null

  return (
    <Page
      eyebrow={
        <Link route="admin.products.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Products
        </Link>
      }
      title={product?.title ?? 'Product'}
      description={
        status && (
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        )
      }
      actions={
        product &&
        (canArchive || editable) && (
          <div className="flex flex-wrap gap-2">
            {canArchive && (
              <FormButton
                type="button"
                variant="secondary"
                size="sm"
                loading={archive.isPending || unarchive.isPending}
                onClick={onToggleArchive}
              >
                {isArchived ? (
                  <>
                    <ArchiveRestore size={15} /> Unarchive
                  </>
                ) : (
                  <>
                    <Archive size={15} /> Archive
                  </>
                )}
              </FormButton>
            )}
            {editable && (
              <FormButton
                type="submit"
                form={PRODUCT_FORM_ID}
                size="sm"
                loading={saving > 0}
                loadingText="Saving…"
                disabled={mediaBusy}
                title={mediaBusy ? 'Wait for photos to finish uploading' : undefined}
              >
                <Save size={15} /> Save product
              </FormButton>
            )}
          </div>
        )
      }
    >
      {isLoading ? (
        <EditSkeleton />
      ) : isError || !product ? (
        <div className={`${card.base} flex flex-col items-center gap-3 py-12 text-center`}>
          <span className="text-[14px] text-muted">Could not load this product.</span>
          <div className="flex gap-2.5">
            <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </FormButton>
            <Link
              route="admin.products.home"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Back to products
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {isArchived && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This product is archived and hidden from the store. Unarchive it to make changes.
            </p>
          )}
          <DetailsCard
            product={product}
            editable={editable}
            formId={PRODUCT_FORM_ID}
            onMediaBusyChange={setMediaBusy}
            pricing={
              <>
                <PricingCard key={product.id} product={product} editable={editable} />
                <OptionsCard
                  key={product.options
                    .flatMap((option) => [option.id, ...option.values.map((value) => value.id)])
                    .join('|')}
                  product={product}
                  editable={editable}
                />
                <VariantsTable
                  product={product}
                  editable={editable}
                  canEditInventory={canEditInventory && !isArchived}
                />
              </>
            }
            reviews={<ReviewsCard productId={product.id} editable={canEdit} />}
          />
        </div>
      )}
    </Page>
  )
}

AdminProductsEdit.layout = [AdminLayout]
