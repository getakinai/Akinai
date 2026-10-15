import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormImageUpload, FormInput, FormTextarea } from '~/components/form'
import { Dialog } from '~/components/ui'
import { useFilePreview } from '~/hooks/use_file_preview'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { type MenuItemType } from '~/lib/storefront'
import { useCan } from '../_hooks'
import {
  useCreateAdminStorefrontHeroSlide,
  useRemoveAdminStorefrontHeroSlideImage,
  useUpdateAdminStorefrontHeroSlide,
  useUploadAdminStorefrontHeroSlideImage,
} from './_hooks'
import LinkTargetFields from './_link_target_fields'
import {
  AdminStorefrontHeroSlideFormSchema,
  BRANDING_IMAGE_ACCEPT,
  MAX_HERO_IMAGE_UPLOAD_SIZE_MB,
  type AdminStorefrontHeroSlide,
} from './_types'

type HeroSlideDialogProps = {
  open: boolean
  slide: AdminStorefrontHeroSlide | null
  onClose: () => void
}

/**
 * Adds a slide when `slide` is null, otherwise edits it. The picked image
 * is uploaded after the slide is saved; if the upload fails the dialog
 * stays open and the next save updates the slide instead of adding another.
 * Remount with a new `key` to reset the fields between slides.
 */
export default function HeroSlideDialog({ open, slide, onClose }: HeroSlideDialogProps) {
  const canUpload = useCan('storefront.upload')
  const [eyebrow, setEyebrow] = useState(slide?.eyebrow ?? '')
  const [heading, setHeading] = useState(slide?.heading ?? '')
  const [subheading, setSubheading] = useState(slide?.subheading ?? '')
  const [buttonLabel, setButtonLabel] = useState(slide?.buttonLabel ?? '')
  const [type, setType] = useState<MenuItemType>(slide?.type ?? 'collection')
  const [collectionId, setCollectionId] = useState(slide?.collectionId ?? '')
  const [pageId, setPageId] = useState(slide?.pageId ?? '')
  const [url, setUrl] = useState(slide?.url ?? '')
  const [isVisible, setIsVisible] = useState(slide?.isVisible ?? true)
  const [preview, setPreview] = useFilePreview()
  const file = preview?.file ?? null
  const [removeImage, setRemoveImage] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(slide?.id ?? null)
  const createSlide = useCreateAdminStorefrontHeroSlide()
  const updateSlide = useUpdateAdminStorefrontHeroSlide()
  const uploadImage = useUploadAdminStorefrontHeroSlideImage()
  const deleteImage = useRemoveAdminStorefrontHeroSlideImage()

  const savedImageUrl = removeImage ? null : (slide?.imageUrl ?? null)
  const imageUrl = preview?.url ?? savedImageUrl

  function onSelectImage(picked: File) {
    if (picked.size > MAX_HERO_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024) {
      return setErrors((current) => ({
        ...current,
        image: `${picked.name} is larger than ${MAX_HERO_IMAGE_UPLOAD_SIZE_MB}MB`,
      }))
    }
    setErrors((current) => ({ ...current, image: '' }))
    setPreview(picked)
    setRemoveImage(false)
  }

  function onRemoveImage() {
    setPreview(null)
    setRemoveImage(true)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStorefrontHeroSlideFormSchema.safeParse({
      eyebrow,
      heading,
      subheading,
      buttonLabel,
      type,
      collectionId: type === 'collection' ? collectionId : null,
      pageId: type === 'page' ? pageId : null,
      url: type === 'url' ? url : null,
      isVisible,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    setSaving(true)
    try {
      const saved = savedId
        ? await updateSlide.mutateAsync({ id: savedId, ...parsed.data })
        : await createSlide.mutateAsync(parsed.data)
      setSavedId(saved.id)
      if (canUpload && file) await uploadImage.mutateAsync({ id: saved.id, file })
      else if (canUpload && removeImage && slide?.imageUrl) await deleteImage.mutateAsync(saved.id)
      toast.success(slide ? `${saved.heading} updated` : `${saved.heading} added to the hero`)
      onClose()
    } catch (error) {
      handleMutationError(error, setErrors)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={slide ? 'Edit slide' : 'Add slide'}
      description="Slides rotate in the storefront home hero, in the order shown on this page."
      className="max-w-[760px]!"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormImageUpload
          name="heroSlideImage"
          label="Image"
          image={imageUrl ? { key: 'hero', url: imageUrl } : null}
          tooltip={`Shown beside the text. Landscape PNG, JPG or WebP, up to ${MAX_HERO_IMAGE_UPLOAD_SIZE_MB}MB.`}
          accept={BRANDING_IMAGE_ACCEPT}
          aspect="wide"
          uploadLabel="Choose image"
          uploading={saving && (file !== null || removeImage)}
          canUpload={canUpload}
          disabled={!canUpload || saving}
          error={errors.image || undefined}
          onSelect={onSelectImage}
          onRemove={onRemoveImage}
        />

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <FormInput
            name="heroSlideHeading"
            label="Heading"
            placeholder="Fresh groceries delivered to your door"
            autoComplete="off"
            maxLength={120}
            value={heading}
            onChange={(event) => setHeading(event.target.value)}
            error={errors.heading}
          />

          <FormInput
            name="heroSlideEyebrow"
            label="Badge (optional)"
            placeholder="100% fresh, every day"
            autoComplete="off"
            maxLength={60}
            value={eyebrow}
            onChange={(event) => setEyebrow(event.target.value)}
            error={errors.eyebrow}
          />
        </div>

        <FormTextarea
          name="heroSlideSubheading"
          label="Text (optional)"
          rows={3}
          maxLength={240}
          value={subheading}
          onChange={(event) => setSubheading(event.target.value)}
          error={errors.subheading}
        />

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
          <FormInput
            name="heroSlideButtonLabel"
            label="Button label (optional)"
            placeholder="Shop now"
            autoComplete="off"
            maxLength={30}
            value={buttonLabel}
            onChange={(event) => setButtonLabel(event.target.value)}
            error={errors.buttonLabel}
          />
          <LinkTargetFields
            name="heroSlide"
            open={open}
            type={type}
            onTypeChange={(next) => {
              setType(next)
              setErrors({})
            }}
            collectionId={collectionId}
            onCollectionChange={setCollectionId}
            pageId={pageId}
            onPageChange={setPageId}
            url={url}
            onUrlChange={setUrl}
            errors={errors}
            draftHint={{
              collection:
                'Slides for draft collections stay hidden until the collection is active.',
              page: 'Slides for draft pages stay hidden until the page is active.',
            }}
          />
        </div>

        <FormSwitch
          name="heroSlideVisible"
          label="Show on the storefront"
          checked={isVisible}
          onChange={(event) => setIsVisible(event.target.checked)}
          error={errors.isVisible}
        />

        <div className="flex justify-end gap-2.5">
          <FormButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton size="sm" loading={saving}>
            {slide ? 'Save changes' : 'Add slide'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
