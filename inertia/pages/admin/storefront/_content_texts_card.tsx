import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput, FormTextarea } from '~/components/form'
import { Skeleton } from '~/components/ui'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card } from '~/lib/styles'
import { useAdminStorefrontTheme, useUpdateAdminStorefrontContent } from './_hooks'
import { AdminStorefrontContentFormSchema, type AdminStorefrontTheme } from './_types'

type ContentTextsCardProps = {
  editable: boolean
}

/**
 * Announcement bar above the storefront header and the tagline in the
 * footer. Both live on the storefront theme.
 */
export default function ContentTextsCard({ editable }: ContentTextsCardProps) {
  const { data: theme, isLoading, isError, refetch } = useAdminStorefrontTheme()

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div className="min-w-0">
          <h2 className={card.title}>Announcement and footer</h2>
          <p className="mt-1 text-[13px] text-pretty text-muted">
            The announcement bar is hidden when empty. The footer shows a short default line when no
            tagline is set.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading content">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError || !theme ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-[14px] text-muted">Could not load the storefront content.</span>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </FormButton>
        </div>
      ) : (
        <ContentTextsForm theme={theme} editable={editable} />
      )}
    </section>
  )
}

function ContentTextsForm({ theme, editable }: { theme: AdminStorefrontTheme; editable: boolean }) {
  const [announcementText, setAnnouncementText] = useState(theme.announcementText ?? '')
  const [announcementUrl, setAnnouncementUrl] = useState(theme.announcementUrl ?? '')
  const [footerTagline, setFooterTagline] = useState(theme.footerTagline ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const update = useUpdateAdminStorefrontContent()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStorefrontContentFormSchema.safeParse({
      announcementText,
      announcementUrl,
      footerTagline,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    update.mutate(parsed.data, {
      onSuccess: (saved) => {
        setAnnouncementText(saved.announcementText ?? '')
        setAnnouncementUrl(saved.announcementUrl ?? '')
        setFooterTagline(saved.footerTagline ?? '')
        toast.success('Storefront content saved')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          name="announcementText"
          label="Announcement (optional)"
          placeholder="Free delivery on orders over $50"
          autoComplete="off"
          maxLength={160}
          disabled={!editable}
          value={announcementText}
          onChange={(event) => setAnnouncementText(event.target.value)}
          error={errors.announcementText}
        />
        <div className="flex flex-col gap-1.5">
          <FormInput
            name="announcementUrl"
            label="Announcement link (optional)"
            placeholder="/collections/sale"
            autoComplete="off"
            maxLength={500}
            disabled={!editable || announcementText.trim() === ''}
            value={announcementUrl}
            onChange={(event) => setAnnouncementUrl(event.target.value)}
            error={errors.announcementUrl}
          />
          <p className="text-[12.5px] text-muted">
            Start with / for a page on this store, or https:// for another site.
          </p>
        </div>
      </div>

      <FormTextarea
        name="footerTagline"
        label="Footer tagline (optional)"
        rows={2}
        maxLength={200}
        disabled={!editable}
        value={footerTagline}
        onChange={(event) => setFooterTagline(event.target.value)}
        error={errors.footerTagline}
      />

      {editable && (
        <div className="flex justify-end">
          <FormButton size="sm" loading={update.isPending}>
            Save
          </FormButton>
        </div>
      )}
    </form>
  )
}
