import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormSwitch, FormImageUpload, FormInput, FormSelect } from '~/components/form'
import { Dialog } from '~/components/ui'
import { useFilePreview } from '~/hooks/use_file_preview'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import {
  PROMO_PLACEMENT_LABELS,
  PROMO_TONE_LABELS,
  PROMO_TONES,
  type MenuItemType,
  type PromoPlacement,
  type PromoTone,
} from '~/lib/storefront'
import { useCan } from '../_hooks'
import {
  useCreateAdminStorefrontPromoBanner,
  useRemoveAdminStorefrontPromoBannerImage,
  useUpdateAdminStorefrontPromoBanner,
  useUploadAdminStorefrontPromoBannerImage,
} from './_hooks'
import LinkTargetFields from './_link_target_fields'
import {
  AdminStorefrontPromoBannerFormSchema,
  BRANDING_IMAGE_ACCEPT,
  MAX_HERO_IMAGE_UPLOAD_SIZE_MB,
  type AdminStorefrontPromoBanner,
} from './_types'

const TONE_OPTIONS = PROMO_TONES.map((value) => ({ value, label: PROMO_TONE_LABELS[value] }))

type PromoBannerDialogProps = {
  open: boolean
  placement: PromoPlacement
  banner: AdminStorefrontPromoBanner | null
  onClose: () => void
}

/**
 * Adds a banner to `placement` when `banner` is null, otherwise edits it.
 * The picked image is uploaded after the banner is saved; if the upload
 * fails the dialog stays open and the next save updates the banner instead
 * of adding another. Remount with a new `key` to reset the fields.
 */
export default function PromoBannerDialog({
  open,
  placement,
  banner,
  onClose,
}: PromoBannerDialogProps) {
  const canUpload = useCan('storefront.upload')
  const [eyebrow, setEyebrow] = useState(banner?.eyebrow ?? '')
  const [title, setTitle] = useState(banner?.title ?? '')
  const [buttonLabel, setButtonLabel] = useState(banner?.buttonLabel ?? '')
  const [tone, setTone] = useState<PromoTone>(banner?.tone ?? 'primary')
  const [type, setType] = useState<MenuItemType>(banner?.type ?? 'collection')
  const [collectionId, setCollectionId] = useState(banner?.collectionId ?? '')
  const [pageId, setPageId] = useState(banner?.pageId ?? '')
  const [url, setUrl] = useState(banner?.url ?? '')
  const [isVisible, setIsVisible] = useState(banner?.isVisible ?? true)
  const [preview, setPreview] = useFilePreview()
  const file = preview?.file ?? null
  const [removeImage, setRemoveImage] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(banner?.id ?? null)
  const createBanner = useCreateAdminStorefrontPromoBanner()
  const updateBanner = useUpdateAdminStorefrontPromoBanner()
  const uploadImage = useUploadAdminStorefrontPromoBannerImage()
  const deleteImage = useRemoveAdminStorefrontPromoBannerImage()

  const savedImageUrl = removeImage ? null : (banner?.imageUrl ?? null)
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
    const parsed = AdminStorefrontPromoBannerFormSchema.safeParse({
      eyebrow,
      title,
      buttonLabel,
      tone,
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
        ? await updateBanner.mutateAsync({ id: savedId, ...parsed.data })
        : await createBanner.mutateAsync({ placement, ...parsed.data })
      setSavedId(saved.id)
      if (canUpload && file) await uploadImage.mutateAsync({ id: saved.id, file })
      else if (canUpload && removeImage && banner?.imageUrl) await deleteImage.mutateAsync(saved.id)
      toast.success(banner ? `${saved.title} updated` : `${saved.title} added`)
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
      title={banner ? 'Edit banner' : 'Add banner'}
      description={`Shown in the ${PROMO_PLACEMENT_LABELS[placement].toLowerCase()}.`}
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormImageUpload
          name="promoBannerImage"
          label="Image (optional)"
          image={imageUrl ? { key: 'promo', url: imageUrl } : null}
          tooltip={`Shown in a circle beside the text. PNG, JPG or WebP, up to ${MAX_HERO_IMAGE_UPLOAD_SIZE_MB}MB.`}
          accept={BRANDING_IMAGE_ACCEPT}
          uploadLabel="Choose image"
          uploading={saving && (file !== null || removeImage)}
          canUpload={canUpload}
          disabled={!canUpload || saving}
          error={errors.image || undefined}
          onSelect={onSelectImage}
          onRemove={onRemoveImage}
        />

        <FormInput
          name="promoBannerEyebrow"
          label="Badge (optional)"
          placeholder="This week only"
          autoComplete="off"
          maxLength={40}
          value={eyebrow}
          onChange={(event) => setEyebrow(event.target.value)}
          error={errors.eyebrow}
        />

        <FormInput
          name="promoBannerTitle"
          label="Title"
          placeholder="Save on seasonal favourites"
          autoComplete="off"
          maxLength={100}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            name="promoBannerButtonLabel"
            label="Button label (optional)"
            placeholder="Shop now"
            autoComplete="off"
            maxLength={30}
            value={buttonLabel}
            onChange={(event) => setButtonLabel(event.target.value)}
            error={errors.buttonLabel}
          />
          <FormSelect
            name="promoBannerTone"
            label="Color"
            options={TONE_OPTIONS}
            value={tone}
            onChange={(event) => setTone(event.target.value as PromoTone)}
            error={errors.tone}
          />
        </div>

        <LinkTargetFields
          name="promoBanner"
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
            collection: 'Banners for draft collections stay hidden until the collection is active.',
            page: 'Banners for draft pages stay hidden until the page is active.',
          }}
        />

        <FormSwitch
          name="promoBannerVisible"
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
            {banner ? 'Save changes' : 'Add banner'}
          </FormButton>
        </div>
      </form>
    </Dialog>
  )
}
