import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import { Badge, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import DiscountForm from './_discount_form'
import { discountStatusMeta, discountTypeMeta } from './_format'
import { useAdminDiscount, useUpdateAdminDiscount } from './_hooks'

export default function AdminDiscountsEdit({ id }: { id: string }) {
  const { data: discount, isLoading, isError, refetch } = useAdminDiscount(id)
  const updateDiscount = useUpdateAdminDiscount()
  const canEdit = useCan('discounts.edit')
  const [errors, setErrors] = useState<FieldErrors>({})
  const status = discount ? discountStatusMeta[discount.status] : null

  return (
    <Page
      eyebrow={
        <Link
          route="admin.discounts.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Discounts
        </Link>
      }
      title={discount?.title ?? 'Discount'}
      description={
        discount
          ? `${discountTypeMeta[discount.type].label} · ${
              discount.code ? `Code ${discount.code}` : 'Automatic discount'
            } · Used ${discount.usageCount}${
              discount.usageLimit !== null ? ` of ${discount.usageLimit}` : ''
            } times`
          : undefined
      }
      actions={
        status && (
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        )
      }
    >
      {isLoading ? (
        <div className={`${card.base} flex flex-col gap-3`} aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !discount ? (
        <div className={`${card.base} py-12 text-center text-[14px] text-muted`}>
          Could not load this discount.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {discount.status === 'archived' && (
            <p className={`${card.base} text-[13.5px] text-muted`}>
              This discount is archived. Restore it from the list before editing it.
            </p>
          )}
          <DiscountForm
            key={discount.id}
            type={discount.type}
            discount={discount}
            disabled={!canEdit || discount.status === 'archived'}
            submitLabel="Save discount"
            isPending={updateDiscount.isPending}
            errors={errors}
            setErrors={setErrors}
            onSubmit={(data) =>
              updateDiscount.mutate(
                { id: discount.id, ...data },
                {
                  onSuccess: (saved) => toast.success(`${saved.title} saved`),
                  onError: (error) => handleMutationError(error, setErrors),
                }
              )
            }
          />
        </div>
      )}
    </Page>
  )
}

AdminDiscountsEdit.layout = [AdminLayout]
