import { useState } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card } from '~/lib/styles'
import { useCan } from '../../_hooks'
import { useAdminProduct, useCreateAdminVariant } from '../_hooks'
import FirstOptionForm from './_first_option_form'
import VariantForm from './_variant_form'
import VariantPageMessage from './_variant_page_message'

export default function AdminVariantsCreate({ productId }: { productId: string }) {
  const { data: product, isLoading, isError, refetch } = useAdminProduct(productId)
  const createVariant = useCreateAdminVariant()
  const canEdit = useCan('products.edit')
  const [errors, setErrors] = useState<FieldErrors>({})
  const backToProduct = () => router.visit(`/admin/products/edit/${productId}`)

  return (
    <Page
      eyebrow={
        <Link
          route="admin.products.edit"
          routeParams={{ id: productId }}
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> {product?.title ?? 'Product'}
        </Link>
      }
      title="Add variant"
      description="Pick a combination of this product's option values and set its price, SKU and stock tracking."
    >
      {isLoading ? (
        <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !product ? (
        <VariantPageMessage productId={productId} onRetry={() => refetch()}>
          Could not load this product.
        </VariantPageMessage>
      ) : product.status === 'archived' ? (
        <VariantPageMessage productId={productId}>
          This product is archived. Unarchive it before adding variants.
        </VariantPageMessage>
      ) : product.options.length === 0 ? (
        <FirstOptionForm
          product={product}
          editable={canEdit}
          onCancel={backToProduct}
          onVariantsAdded={backToProduct}
        />
      ) : (
        <VariantForm
          product={product}
          editable={canEdit}
          pending={createVariant.isPending}
          submitLabel="Add variant"
          errors={errors}
          setErrors={setErrors}
          onCancel={backToProduct}
          onSubmit={(data) =>
            createVariant.mutate(
              { productId, ...data },
              {
                onSuccess: (variant) => {
                  toast.success(`${variant.title} added`)
                  backToProduct()
                },
                onError: (error) => handleMutationError(error, setErrors),
              }
            )
          }
        />
      )}
    </Page>
  )
}

AdminVariantsCreate.layout = [AdminLayout]
