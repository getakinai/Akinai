import { useState } from 'react'
import { toast } from 'sonner'
import { FormImageUpload } from '~/components/form'
import { HttpError } from '~/lib/http'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import { useRemoveAdminCollectionImage, useUploadAdminCollectionImage } from './_hooks'
import {
  COLLECTION_IMAGE_ACCEPT,
  MAX_COLLECTION_IMAGE_UPLOAD_SIZE_MB,
  type AdminCollection,
} from './_types'

type CoverImageCardProps = {
  collection: AdminCollection
  editable: boolean
}

/** Uploads or removes the cover photo as soon as it is picked. */
export default function CoverImageCard({ collection, editable }: CoverImageCardProps) {
  const canUpload = useCan('collections.upload') && editable
  const upload = useUploadAdminCollectionImage()
  const remove = useRemoveAdminCollectionImage()
  const [error, setError] = useState<string>()

  function onError(failure: unknown) {
    if (failure instanceof HttpError) {
      setError(failure.fieldErrors.image ?? failure.message)
    } else {
      toast.error('Something went wrong')
    }
  }

  function onSelect(file: File) {
    if (file.size > MAX_COLLECTION_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024) {
      return setError(`${file.name} is larger than ${MAX_COLLECTION_IMAGE_UPLOAD_SIZE_MB}MB`)
    }
    setError(undefined)
    upload.mutate(
      { id: collection.id, file },
      { onSuccess: () => toast.success('Cover photo updated'), onError }
    )
  }

  function onRemove() {
    setError(undefined)
    remove.mutate(collection.id, {
      onSuccess: () => toast.success('Cover photo removed'),
      onError,
    })
  }

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div className="min-w-0">
          <h2 className={card.title}>Cover photo</h2>
          <p className="mt-1 text-[13px] text-pretty text-muted">
            Shown on this collection’s tile in the store’s Shop by category carousel.
          </p>
        </div>
      </div>
      <FormImageUpload
        name="collectionImage"
        label="Image"
        image={collection.imageUrl ? { key: 'cover', url: collection.imageUrl } : null}
        hint={`Square images work best. PNG, JPG or WebP, up to ${MAX_COLLECTION_IMAGE_UPLOAD_SIZE_MB}MB.`}
        accept={COLLECTION_IMAGE_ACCEPT}
        uploadLabel="Upload cover"
        uploading={upload.isPending || remove.isPending}
        canUpload={canUpload}
        disabled={!canUpload}
        error={error}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    </section>
  )
}
