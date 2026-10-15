import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FormImageGallery, FormImageUpload } from '~/components/form'
import { type TabItem } from '~/components/ui'
import { HttpError, type FieldErrors } from '~/lib/http'
import { useCan } from '../_hooks'
import { useUploadAdminProductImage } from './_hooks'
import {
  IMAGE_ACCEPT,
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_UPLOAD_SIZE_MB,
  type UploadedImage,
} from './_types'

export type MediaValues = {
  cover: UploadedImage | null
  gallery: UploadedImage[]
}

export const emptyMedia: MediaValues = { cover: null, gallery: [] }

export function mediaPayload({ cover, gallery }: MediaValues) {
  return { coverImage: cover?.key ?? null, galleryImages: gallery.map(({ key }) => key) }
}

export type ProductFormTab = 'details' | 'pricing' | 'photos' | 'seo' | 'reviews' | 'activity'

const TAB_ORDER: ProductFormTab[] = ['details', 'photos', 'seo']

function tabForField(field: string): ProductFormTab {
  if (field === 'coverImage' || field.startsWith('galleryImages')) return 'photos'
  if (field === 'seoTitle' || field === 'seoDescription') return 'seo'
  return 'details'
}

function countedLabel(label: string, count: number) {
  return (
    <>
      {label}
      {count > 0 && (
        <span className="rounded-full bg-line px-1.5 text-[11.5px] text-muted tabular-nums">
          {count}
        </span>
      )}
    </>
  )
}

/**
 * Tab items for the product forms, with a dot on tabs holding errors.
 * `saved` adds the Pricing, Reviews and Activity tabs, which need a saved product.
 */
export function productFormTabs(
  errors: FieldErrors,
  media: MediaValues,
  { saved }: { saved?: { reviewsCount: number } } = {}
): TabItem<ProductFormTab>[] {
  const invalid = new Set(Object.keys(errors).map(tabForField))
  const photoCount = (media.cover ? 1 : 0) + media.gallery.length
  return [
    { id: 'details', label: 'Details', invalid: invalid.has('details') },
    ...(saved ? [{ id: 'pricing' as const, label: 'Pricing' }] : []),
    { id: 'photos', label: countedLabel('Photos', photoCount), invalid: invalid.has('photos') },
    { id: 'seo', label: 'Search Engine', invalid: invalid.has('seo') },
    ...(saved
      ? [
          { id: 'reviews' as const, label: countedLabel('Reviews', saved.reviewsCount) },
          { id: 'activity' as const, label: 'Activity' },
        ]
      : []),
  ]
}

/**
 * The tab to show after validation fails: stay on `current` when it has
 * errors, otherwise jump to the first tab that does.
 */
export function tabForErrors(errors: FieldErrors, current: ProductFormTab): ProductFormTab {
  const invalid = new Set(Object.keys(errors).map(tabForField))
  if (invalid.size === 0 || invalid.has(current)) return current
  return TAB_ORDER.find((tab) => invalid.has(tab)) ?? current
}

type MediaFieldsProps = {
  values: MediaValues
  onChange: (update: (current: MediaValues) => MediaValues) => void
  errors: FieldErrors
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}

const maxBytes = MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024
const acceptedTypes = IMAGE_ACCEPT.split(',')

function rejectReason(file: File): string | null {
  if (!acceptedTypes.includes(file.type)) return `${file.name} is not a JPG, PNG, WebP or GIF image`
  if (file.size > maxBytes) return `${file.name} is larger than ${MAX_IMAGE_UPLOAD_SIZE_MB}MB`
  return null
}

function galleryError(errors: FieldErrors): string | undefined {
  const key = Object.keys(errors).find((field) => field.startsWith('galleryImages'))
  return key ? errors[key] : undefined
}

/**
 * Cover photo plus an ordered gallery. Files upload as soon as they are
 * picked; the form saves the returned keys with the product.
 */
export default function MediaFields({
  values,
  onChange,
  errors,
  disabled,
  onBusyChange,
}: MediaFieldsProps) {
  const canUpload = useCan('products.upload')
  const upload = useUploadAdminProductImage()
  const [coverUploading, setCoverUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(0)
  const busy = coverUploading || galleryUploading > 0

  useEffect(() => {
    onBusyChange?.(busy)
  }, [busy, onBusyChange])

  async function uploadFile(file: File): Promise<UploadedImage | null> {
    const reason = rejectReason(file)
    if (reason) {
      toast.error(reason)
      return null
    }
    try {
      return await upload.mutateAsync(file)
    } catch (error) {
      const message =
        error instanceof HttpError
          ? (error.fieldErrors.image ?? error.message)
          : 'Upload failed. Try again.'
      toast.error(message)
      return null
    }
  }

  async function onSelectCover(file: File) {
    setCoverUploading(true)
    const image = await uploadFile(file)
    setCoverUploading(false)
    if (image) onChange((current) => ({ ...current, cover: image }))
  }

  async function onAddGallery(files: File[]) {
    setGalleryUploading((count) => count + files.length)
    await Promise.all(
      files.map(async (file) => {
        const image = await uploadFile(file)
        setGalleryUploading((count) => count - 1)
        if (image) {
          onChange((current) => ({
            ...current,
            gallery: [...current.gallery, image].slice(0, MAX_GALLERY_IMAGES),
          }))
        }
      })
    )
  }

  function onMove(index: number, direction: -1 | 1) {
    onChange((current) => {
      const gallery = [...current.gallery]
      const target = index + direction
      if (target < 0 || target >= gallery.length) return current
      ;[gallery[index], gallery[target]] = [gallery[target], gallery[index]]
      return { ...current, gallery }
    })
  }

  function onMakeCover(index: number) {
    onChange((current) => {
      const gallery = [...current.gallery]
      const [picked] = gallery.splice(index, 1)
      if (current.cover) gallery.splice(index, 0, current.cover)
      return { cover: picked, gallery }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <FormImageUpload
        name="coverImage"
        label="Cover photo"
        image={values.cover}
        hint={`Shown on product cards and search. JPG, PNG, WebP or GIF up to ${MAX_IMAGE_UPLOAD_SIZE_MB}MB.`}
        accept={IMAGE_ACCEPT}
        uploading={coverUploading}
        canUpload={canUpload}
        disabled={disabled}
        error={errors.coverImage}
        onSelect={onSelectCover}
        onRemove={() => onChange((current) => ({ ...current, cover: null }))}
      />
      <FormImageGallery
        name="galleryImages"
        label="Gallery"
        images={values.gallery}
        max={MAX_GALLERY_IMAGES}
        hint={`Optional. Up to ${MAX_GALLERY_IMAGES} more photos.`}
        accept={IMAGE_ACCEPT}
        uploadingCount={galleryUploading}
        canUpload={canUpload}
        disabled={disabled}
        error={galleryError(errors)}
        onAdd={onAddGallery}
        onRemove={(index) =>
          onChange((current) => ({
            ...current,
            gallery: current.gallery.filter((_, position) => position !== index),
          }))
        }
        onMove={onMove}
        onMakeCover={onMakeCover}
      />
    </div>
  )
}
