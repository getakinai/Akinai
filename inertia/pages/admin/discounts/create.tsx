import { useState } from 'react'
import { toast } from 'sonner'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import AdminLayout from '~/layouts/admin'
import { handleMutationError } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import DiscountForm from './_discount_form'
import { discountTypeMeta } from './_format'
import { useCreateAdminDiscount } from './_hooks'
import { type DiscountType } from './_types'

export default function AdminDiscountsCreate({ type }: { type: DiscountType }) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const createDiscount = useCreateAdminDiscount()
  const meta = discountTypeMeta[type]

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
      title={`Create discount: ${meta.label}`}
      description={meta.description}
    >
      <DiscountForm
        type={type}
        submitLabel="Create discount"
        isPending={createDiscount.isPending}
        errors={errors}
        setErrors={setErrors}
        onSubmit={(data) =>
          createDiscount.mutate(data, {
            onSuccess: (discount) => {
              toast.success(`${discount.title} created`)
              router.visit(`/admin/discounts/edit/${discount.id}`)
            },
            onError: (error) => handleMutationError(error, setErrors),
          })
        }
        secondaryAction={
          <FormButton
            type="button"
            variant="secondary"
            onClick={() => router.visit('/admin/discounts')}
          >
            Cancel
          </FormButton>
        }
      />
    </Page>
  )
}

AdminDiscountsCreate.layout = [AdminLayout]
