import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput, FormSwatchPicker } from '~/components/form'
import { ProductLabelBadge } from '~/components/storefront'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import {
  PRODUCT_LABEL_COLOR_CLASSES,
  PRODUCT_LABEL_COLOR_NAMES,
  PRODUCT_LABEL_COLORS,
  type ProductLabelColor,
} from '~/lib/product_label'
import { useCreateAdminProductLabel, useUpdateAdminProductLabel } from './_hooks'
import { AdminProductLabelFormSchema, type AdminProductLabel } from './_types'

type ProductLabelDialogProps = {
  open: boolean
  productLabel: AdminProductLabel | null
  onClose: () => void
}

const colorOptions = PRODUCT_LABEL_COLORS.map((color) => ({
  value: color,
  label: PRODUCT_LABEL_COLOR_NAMES[color],
  className: PRODUCT_LABEL_COLOR_CLASSES[color],
}))

/**
 * Creates a label when `productLabel` is null, otherwise edits it.
 * Remount with a new `key` to reset the fields between labels.
 */
export default function ProductLabelDialog({
  open,
  productLabel,
  onClose,
}: ProductLabelDialogProps) {
  const [name, setName] = useState(productLabel?.name ?? '')
  const [color, setColor] = useState<ProductLabelColor>(productLabel?.color ?? 'red')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createLabel = useCreateAdminProductLabel()
  const updateLabel = useUpdateAdminProductLabel()
  const isPending = createLabel.isPending || updateLabel.isPending

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminProductLabelFormSchema.safeParse({ name, color })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminProductLabel) => {
        toast.success(productLabel ? `${saved.name} updated` : `${saved.name} created`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (productLabel) {
      updateLabel.mutate({ id: productLabel.id, ...parsed.data }, options)
    } else {
      createLabel.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={productLabel ? 'Edit label' : 'Add label'}
      description="Labels show as a badge over the product photo in the store. Pick one on the product form."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="productLabelName"
          label="Name"
          placeholder="New"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        <FormSwatchPicker
          name="productLabelColor"
          legend="Color"
          value={color}
          onChange={setColor}
          options={colorOptions}
          error={errors.color}
        />
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          Preview
          <ProductLabelBadge label={{ name: name.trim() || 'New', color }} />
        </div>
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {productLabel ? 'Save changes' : 'Create label'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
