import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormImageUpload, FormInput } from '~/components/form'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card } from '~/lib/styles'
import { useCan } from '../_hooks'
import {
  useRemoveAdminStorefrontBranding,
  useUpdateAdminStorefrontBrand,
  useUploadAdminStorefrontBranding,
  type BrandingAsset,
} from './_hooks'
import {
  AdminStorefrontBrandFormSchema,
  BRANDING_IMAGE_ACCEPT,
  FAVICON_MIN_SIZE,
  MAX_BRAND_NAME_LENGTH,
  MAX_FAVICON_UPLOAD_SIZE_MB,
  MAX_LOGO_UPLOAD_SIZE_MB,
  type AdminStorefrontTheme,
} from './_types'

const LABELS: Record<BrandingAsset, string> = { logo: 'Logo', favicon: 'Favicon' }

const MAX_SIZE_MB: Record<BrandingAsset, number> = {
  logo: MAX_LOGO_UPLOAD_SIZE_MB,
  favicon: MAX_FAVICON_UPLOAD_SIZE_MB,
}

function tooLarge(asset: BrandingAsset, file: File) {
  const maxMb = MAX_SIZE_MB[asset]
  return file.size > maxMb * 1024 * 1024 ? `${file.name} is larger than ${maxMb}MB` : null
}

function BrandNameForm({ theme }: { theme: AdminStorefrontTheme }) {
  const canEdit = useCan('storefront.edit')
  const saved = theme.brandName ?? ''
  const [brandName, setBrandName] = useState(saved)
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateBrand = useUpdateAdminStorefrontBrand()
  const isDirty = brandName.trim() !== saved

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStorefrontBrandFormSchema.safeParse({ brandName })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateBrand.mutate(parsed.data, {
      onSuccess: (updated) => {
        setBrandName(updated.brandName ?? '')
        toast.success('Brand name saved')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className="flex flex-col gap-1.5" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <FormInput
            name="brandName"
            label="Brand name"
            value={brandName}
            maxLength={MAX_BRAND_NAME_LENGTH}
            placeholder="Uses your store name when empty"
            disabled={!canEdit}
            aria-describedby="brandName-hint"
            onChange={(event) => setBrandName(event.target.value)}
            error={errors.brandName}
          />
        </div>
        {canEdit && (
          <FormButton size="sm" disabled={!isDirty} loading={updateBrand.isPending}>
            Save name
          </FormButton>
        )}
      </div>
      <p id="brandName-hint" className="text-[12.5px] text-muted">
        Shown next to the logo in the store header and as the home screen app name.
      </p>
    </form>
  )
}

/**
 * Brand name, logo and favicon. Each saves on its own, separate from the
 * color form.
 */
export default function BrandingCard({ theme }: { theme: AdminStorefrontTheme }) {
  const canUpload = useCan('storefront.upload')
  const uploadLogo = useUploadAdminStorefrontBranding()
  const uploadFavicon = useUploadAdminStorefrontBranding()
  const remove = useRemoveAdminStorefrontBranding()
  const [errors, setErrors] = useState<FieldErrors>({})

  const uploads = { logo: uploadLogo, favicon: uploadFavicon }

  function onSelect(asset: BrandingAsset, file: File) {
    const error = tooLarge(asset, file)
    if (error) return setErrors((current) => ({ ...current, [asset]: error }))

    setErrors((current) => ({ ...current, [asset]: '' }))
    uploads[asset].mutate(
      { asset, file },
      {
        onSuccess: () => toast.success(`${LABELS[asset]} updated`),
        onError: (mutationError) =>
          handleMutationError(mutationError, (fieldErrors) =>
            setErrors((current) => ({ ...current, ...fieldErrors }))
          ),
      }
    )
  }

  function onRemove(asset: BrandingAsset) {
    setErrors((current) => ({ ...current, [asset]: '' }))
    remove.mutate(asset, {
      onSuccess: () => toast.success(`${LABELS[asset]} removed`),
      onError: (mutationError) => handleMutationError(mutationError, () => undefined),
    })
  }

  const busy = uploadLogo.isPending || uploadFavicon.isPending || remove.isPending

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div>
          <div className={card.eyebrow}>Branding</div>
          <h2 className={card.title}>Name, logo and favicon</h2>
        </div>
      </div>
      <BrandNameForm theme={theme} />
      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-2">
        <FormImageUpload
          name="logo"
          label="Logo"
          image={theme.logoUrl ? { key: 'logo', url: theme.logoUrl } : null}
          hint={`Shown in the store header. PNG, JPG or WebP, up to ${MAX_LOGO_UPLOAD_SIZE_MB}MB. Transparent PNG works best.`}
          accept={BRANDING_IMAGE_ACCEPT}
          fit="contain"
          uploadLabel="Upload logo"
          uploading={uploadLogo.isPending || (remove.isPending && remove.variables === 'logo')}
          canUpload={canUpload}
          disabled={!canUpload || (busy && !uploadLogo.isPending)}
          error={errors.logo || undefined}
          onSelect={(file) => onSelect('logo', file)}
          onRemove={() => onRemove('logo')}
        />
        <FormImageUpload
          name="favicon"
          label="Favicon"
          image={theme.faviconUrl ? { key: 'favicon', url: theme.faviconUrl } : null}
          hint={`Browser tab and home screen icon. Square image, at least ${FAVICON_MIN_SIZE} x ${FAVICON_MIN_SIZE}. Every icon size is created for you.`}
          accept={BRANDING_IMAGE_ACCEPT}
          fit="contain"
          uploadLabel="Upload favicon"
          uploading={
            uploadFavicon.isPending || (remove.isPending && remove.variables === 'favicon')
          }
          canUpload={canUpload}
          disabled={!canUpload || (busy && !uploadFavicon.isPending)}
          error={errors.favicon || undefined}
          onSelect={(file) => onSelect('favicon', file)}
          onRemove={() => onRemove('favicon')}
        />
      </div>
    </section>
  )
}
