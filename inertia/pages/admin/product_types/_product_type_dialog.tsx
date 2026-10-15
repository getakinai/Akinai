import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminProductType, useUpdateAdminProductType } from './_hooks'
import { AdminProductTypeFormSchema, type AdminProductType } from './_types'

type ProductTypeDialogProps = {
  open: boolean
  productType: AdminProductType | null
  onClose: () => void
}

/**
 * Creates a product type when `productType` is null, otherwise renames it.
 * Remount with a new `key` to reset the field between types.
 */
export default function ProductTypeDialog({ open, productType, onClose }: ProductTypeDialogProps) {
  const [name, setName] = useState(productType?.name ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createProductType = useCreateAdminProductType()
  const updateProductType = useUpdateAdminProductType()
  const isPending = createProductType.isPending || updateProductType.isPending

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminProductTypeFormSchema.safeParse({ name })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminProductType) => {
        toast.success(productType ? `${saved.name} updated` : `${saved.name} created`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (productType) {
      updateProductType.mutate({ id: productType.id, ...parsed.data }, options)
    } else {
      createProductType.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={productType ? 'Edit product type' : 'Add product type'}
      description={
        productType
          ? 'Renaming updates every product of this type. Automated collections match the new name.'
          : 'Product types appear in the product form dropdown.'
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="productTypeName"
          label="Name"
          placeholder="Gift box"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {productType ? 'Save changes' : 'Create product type'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
