import { type ChangeEvent, type ReactNode } from 'react'
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import InfoTooltip from '~/components/ui/info_tooltip'
import { buttonClasses, cn, field } from '~/lib/styles'

export type FormImageValue = { key: string; url: string }

type FormImageUploadProps = {
  name: string
  label: string
  image: FormImageValue | null
  hint?: string
  /** Extra help shown in an info tooltip next to the label. */
  tooltip?: ReactNode
  accept?: string
  fit?: 'cover' | 'contain'
  aspect?: 'square' | 'wide'
  uploadLabel?: string
  uploading?: boolean
  canUpload?: boolean
  disabled?: boolean
  error?: string
  onSelect: (file: File) => void
  onRemove: () => void
}

const filePickerFocus =
  'cursor-pointer has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring has-[:disabled]:pointer-events-none has-[:disabled]:opacity-45'

function toSafeImageSrc(url: string): string | null {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'blob:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:'
      ? parsed.href
      : null
  } catch {
    return null
  }
}

/**
 * Single image picker with preview. Uploading is up to the caller: it gets
 * the picked file through `onSelect` and passes the stored image back.
 */
export default function FormImageUpload({
  name,
  label,
  image,
  hint,
  tooltip,
  accept = 'image/*',
  fit = 'cover',
  aspect = 'square',
  uploadLabel = 'Upload photo',
  uploading = false,
  canUpload = true,
  disabled = false,
  error,
  onSelect,
  onRemove,
}: FormImageUploadProps) {
  const safeImageSrc = image ? toSafeImageSrc(image.url) : null

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onSelect(file)
  }

  const picker = canUpload && !disabled && (
    <label
      className={cn(buttonClasses({ variant: 'secondary', size: 'sm' }), filePickerFocus)}
      htmlFor={name}
    >
      <Upload size={14} />
      {image ? 'Replace' : uploadLabel}
      <input
        id={name}
        name={name}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={uploading}
        onChange={onChange}
        aria-invalid={error ? 'true' : 'false'}
      />
    </label>
  )

  return (
    <div className={field.wrapper}>
      {tooltip ? (
        <div className="relative flex items-center gap-1">
          <span className={field.label}>{label}</span>
          <InfoTooltip label={`About ${label.toLowerCase()}`}>{tooltip}</InfoTooltip>
        </div>
      ) : (
        <span className={field.label}>{label}</span>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            'relative w-full min-w-0 overflow-hidden rounded-lg border border-line-2 bg-paper',
            aspect === 'wide' ? 'aspect-video max-w-[260px]' : 'aspect-square max-w-[200px]'
          )}
        >
          {safeImageSrc ? (
            <img
              src={safeImageSrc}
              alt=""
              className={cn('size-full', fit === 'contain' ? 'object-contain p-3' : 'object-cover')}
            />
          ) : (
            <span className="grid size-full place-items-center text-subtle">
              <ImageIcon size={28} strokeWidth={1.5} />
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-card/70" role="status">
              <Loader2 size={20} className="motion-safe:animate-spin" />
              <span className="sr-only">Uploading image</span>
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {picker}
            {image && !disabled && (
              <button
                type="button"
                className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                onClick={onRemove}
                disabled={uploading}
              >
                <Trash2 size={14} />
                Remove
              </button>
            )}
          </div>
          {hint && <span className="text-[12.5px] text-muted">{hint}</span>}
        </div>
      </div>
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
