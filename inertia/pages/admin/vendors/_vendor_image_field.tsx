import { useState } from 'react'
import { toast } from 'sonner'
import { FormImageUpload } from '~/components/form'
import { HttpError } from '~/lib/http'
import { useCan } from '../_hooks'
import { useRemoveAdminVendorImage, useUploadAdminVendorImage } from './_hooks'
import { MAX_VENDOR_IMAGE_UPLOAD_SIZE_MB, VENDOR_IMAGE_ACCEPT, type AdminVendor } from './_types'

/** Uploads or removes the vendor's cover as soon as it is picked. */
export default function VendorImageField({ vendor }: { vendor: AdminVendor }) {
  const canUpload = useCan('vendors.upload') && vendor.isActive
  const upload = useUploadAdminVendorImage()
  const remove = useRemoveAdminVendorImage()
  const [imageUrl, setImageUrl] = useState(vendor.imageUrl)
  const [error, setError] = useState<string>()

  function onError(failure: unknown) {
    if (failure instanceof HttpError) {
      setError(failure.fieldErrors.image ?? failure.message)
    } else {
      toast.error('Something went wrong')
    }
  }

  function onSelect(file: File) {
    if (file.size > MAX_VENDOR_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024) {
      return setError(`${file.name} is larger than ${MAX_VENDOR_IMAGE_UPLOAD_SIZE_MB}MB`)
    }
    setError(undefined)
    upload.mutate(
      { id: vendor.id, file },
      {
        onSuccess: (saved) => {
          setImageUrl(saved.imageUrl)
          toast.success('Cover updated')
        },
        onError,
      }
    )
  }

  function onRemove() {
    setError(undefined)
    remove.mutate(vendor.id, {
      onSuccess: (saved) => {
        setImageUrl(saved.imageUrl)
        toast.success('Cover removed')
      },
      onError,
    })
  }

  return (
    <FormImageUpload
      name="vendorImage"
      label="Cover"
      image={imageUrl ? { key: 'cover', url: imageUrl } : null}
      hint={`Shown in the store’s Shop by brands carousel. Square images work best. PNG, JPG or WebP, up to ${MAX_VENDOR_IMAGE_UPLOAD_SIZE_MB}MB.`}
      accept={VENDOR_IMAGE_ACCEPT}
      uploadLabel="Upload cover"
      uploading={upload.isPending || remove.isPending}
      canUpload={canUpload}
      disabled={!canUpload}
      error={error}
      onSelect={onSelect}
      onRemove={onRemove}
    />
  )
}
