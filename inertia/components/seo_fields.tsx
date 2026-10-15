import { useState } from 'react'
import { FormInput, FormTextarea } from '~/components/form'
import Section from '~/components/section'
import { type FieldErrors } from '~/lib/http'
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from '~/lib/seo'
import { cn } from '~/lib/styles'

type SeoFieldsProps = {
  /** Storefront path the record lives under, e.g. `/products`. */
  pathPrefix: string
  /** Lowercase record noun used in placeholders, e.g. `product`. */
  entityLabel: string
  title: string
  /** The record's URL handle, shown in the preview. */
  slug: string
  /** Renders an editable URL handle field when set. */
  onSlugChange?: (value: string) => void
  seoTitle: string
  onSeoTitleChange: (value: string) => void
  seoDescription: string
  onSeoDescriptionChange: (value: string) => void
  errors: FieldErrors
  disabled?: boolean
  slugPlaceholder?: string
  /** Starts collapsed behind a toggle. Turn off when the fields have their own tab. */
  collapsible?: boolean
}

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span
      className={cn(
        'text-right font-mono text-[11.5px]',
        value.length > max ? 'text-danger' : 'text-subtle'
      )}
    >
      {value.length} / {max}
    </span>
  )
}

/**
 * "Search engine listing" section: SEO title, meta description and
 * (optionally) URL handle, with a search result preview. Empty fields fall
 * back to the record's title and description.
 */
export default function SeoFields({
  pathPrefix,
  entityLabel,
  title,
  slug,
  onSlugChange,
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  errors,
  disabled = false,
  slugPlaceholder,
  collapsible = true,
}: SeoFieldsProps) {
  const previewTitle =
    seoTitle.trim() ||
    title.trim() ||
    `${entityLabel.charAt(0).toUpperCase()}${entityLabel.slice(1)} title`
  const previewSlug = slug.trim() || `${entityLabel}-handle`
  const [open, setOpen] = useState(false)
  const hasError = Boolean(
    errors.seoTitle || errors.seoDescription || (onSlugChange && errors.slug)
  )

  return (
    <Section
      title="Search engine listing"
      description={`How this ${entityLabel} appears in search results and link previews.`}
      collapsible={
        collapsible
          ? { open: open || hasError, onToggle: () => setOpen(!(open || hasError)) }
          : undefined
      }
    >
      <div className="min-w-0 rounded-lg border border-line bg-paper/60 p-4">
        <p className="truncate font-mono text-[12px] text-muted">
          {pathPrefix}/{previewSlug}
        </p>
        <p className="mt-1 truncate text-[15px] font-medium text-info">{previewTitle}</p>
        <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">
          {seoDescription.trim() ||
            'Add a meta description to control the text shown in search results.'}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <FormInput
          name="seoTitle"
          label="Page title"
          autoComplete="off"
          placeholder={title || `Defaults to the ${entityLabel} title`}
          value={seoTitle}
          disabled={disabled}
          onChange={(event) => onSeoTitleChange(event.target.value)}
          error={errors.seoTitle}
        />
        <Counter value={seoTitle} max={SEO_TITLE_MAX} />
      </div>
      <div className="flex flex-col gap-1">
        <FormTextarea
          name="seoDescription"
          label="Meta description"
          rows={3}
          placeholder={`One or two sentences that describe the ${entityLabel} and invite a click.`}
          value={seoDescription}
          disabled={disabled}
          onChange={(event) => onSeoDescriptionChange(event.target.value)}
          error={errors.seoDescription}
        />
        <Counter value={seoDescription} max={SEO_DESCRIPTION_MAX} />
      </div>
      {onSlugChange && (
        <FormInput
          name="slug"
          label="URL handle"
          autoComplete="off"
          placeholder={slugPlaceholder}
          value={slug}
          disabled={disabled}
          onChange={(event) => onSlugChange(event.target.value)}
          error={errors.slug}
        />
      )}
    </Section>
  )
}
