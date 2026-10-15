import { type ChangeEvent } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Plus, Star, X } from 'lucide-react'
import { cn, field } from '~/lib/styles'
import type { FormImageValue } from './form_image_upload'

type FormImageGalleryProps = {
  name: string
  label: string
  images: FormImageValue[]
  max: number
  hint?: string
  accept?: string
  uploadingCount?: number
  canUpload?: boolean
  disabled?: boolean
  error?: string
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  onMove: (index: number, direction: -1 | 1) => void
  onMakeCover?: (index: number) => void
}

const tileAction =
  'grid size-8 place-items-center rounded-md bg-card/90 text-ink shadow-sm transition-[background-color,scale] duration-150 hover:bg-card active:scale-96 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'

/**
 * Ordered thumbnail grid with add, remove, reorder and "set as cover".
 * Uploading is up to the caller: picked files arrive through `onAdd`.
 */
export default function FormImageGallery({
  name,
  label,
  images,
  max,
  hint,
  accept = 'image/*',
  uploadingCount = 0,
  canUpload = true,
  disabled = false,
  error,
  onAdd,
  onRemove,
  onMove,
  onMakeCover,
}: FormImageGalleryProps) {
  const remaining = max - images.length - uploadingCount

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(remaining, 0))
    event.target.value = ''
    if (files.length > 0) onAdd(files)
  }

  return (
    <div className={field.wrapper}>
      <span className={field.label}>{label}</span>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <li
            key={image.key}
            className="relative aspect-square min-w-0 overflow-hidden rounded-lg border border-line-2 bg-paper"
          >
            <img
              src={image.url}
              alt={`Gallery photo ${index + 1}`}
              className="size-full object-cover"
            />
            {!disabled && (
              <>
                <button
                  type="button"
                  className={cn(tileAction, 'absolute top-1.5 right-1.5')}
                  onClick={() => onRemove(index)}
                  aria-label={`Remove gallery photo ${index + 1}`}
                >
                  <X size={14} />
                </button>
                <div className="absolute inset-x-1.5 bottom-1.5 flex flex-wrap justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={tileAction}
                      onClick={() => onMove(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move gallery photo ${index + 1} earlier`}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      className={tileAction}
                      onClick={() => onMove(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label={`Move gallery photo ${index + 1} later`}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  {onMakeCover && (
                    <button
                      type="button"
                      className={tileAction}
                      onClick={() => onMakeCover(index)}
                      aria-label={`Use gallery photo ${index + 1} as the cover`}
                      title="Use as cover"
                    >
                      <Star size={14} />
                    </button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
        {Array.from({ length: uploadingCount }, (_, index) => (
          <li
            key={`uploading-${index}`}
            className="grid aspect-square place-items-center rounded-lg border border-dashed border-line-2 bg-paper text-muted"
            role="status"
          >
            <Loader2 size={20} className="motion-safe:animate-spin" />
            <span className="sr-only">Uploading photo</span>
          </li>
        ))}
        {canUpload && !disabled && remaining > 0 && (
          <li className="min-w-0">
            <label
              htmlFor={name}
              className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-line-2 text-muted transition-colors duration-150 hover:border-ink hover:text-ink has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring"
            >
              <span className="flex flex-col items-center gap-1 text-[13px] font-medium">
                <Plus size={18} />
                Add photos
              </span>
              <input
                id={name}
                name={name}
                type="file"
                accept={accept}
                multiple
                className="sr-only"
                onChange={onChange}
                aria-invalid={error ? 'true' : 'false'}
              />
            </label>
          </li>
        )}
      </ul>
      {images.length === 0 && uploadingCount === 0 && (!canUpload || disabled) && (
        <span className="text-[13px] text-muted">No gallery photos.</span>
      )}
      {hint && <span className="text-[12.5px] text-muted">{hint}</span>}
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
