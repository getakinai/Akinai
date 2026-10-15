import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Dialog } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { useCreateAdminVendor, useUpdateAdminVendor } from './_hooks'
import { AdminVendorFormSchema, type AdminVendor } from './_types'
import VendorImageField from './_vendor_image_field'

type VendorDialogProps = {
  open: boolean
  vendor: AdminVendor | null
  onClose: () => void
}

/**
 * Creates a vendor when `vendor` is null, otherwise renames it. Remount with
 * a new `key` to reset the field between vendors.
 */
export default function VendorDialog({ open, vendor, onClose }: VendorDialogProps) {
  const [name, setName] = useState(vendor?.name ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const createVendor = useCreateAdminVendor()
  const updateVendor = useUpdateAdminVendor()
  const isPending = createVendor.isPending || updateVendor.isPending

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminVendorFormSchema.safeParse({ name })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    const options = {
      onSuccess: (saved: AdminVendor) => {
        toast.success(vendor ? `${saved.name} updated` : `${saved.name} created`)
        onClose()
      },
      onError: (error: unknown) => handleMutationError(error, setErrors),
    }

    if (vendor) {
      updateVendor.mutate({ id: vendor.id, ...parsed.data }, options)
    } else {
      createVendor.mutate(parsed.data, options)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={vendor ? 'Edit vendor' : 'Add vendor'}
      description={
        vendor
          ? 'Renaming updates every product from this vendor. Automated collections match the new name.'
          : 'Vendors appear in the product form dropdown.'
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormInput
          name="vendorName"
          label="Name"
          placeholder="Brand or supplier"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoFocus
        />
        {vendor ? (
          <VendorImageField vendor={vendor} />
        ) : (
          <p className="text-[12.5px] text-muted">
            You can add a cover for the store’s Shop by brands carousel after you create the vendor.
          </p>
        )}
        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={isPending}>
            {vendor ? 'Save changes' : 'Create vendor'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
