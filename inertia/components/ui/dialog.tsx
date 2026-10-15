import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '~/lib/styles'
import IconButton from './icon_button'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Modal built on the native `<dialog>` element: focus trapping, Escape to
 * close and the backdrop come from the browser. Portaled to `document.body`
 * and centered with `inset: 0; margin: auto` (not transform) for mobile Safari.
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    if (!isClient) return
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open, isClient])

  if (!isClient) return null

  return createPortal(
    <dialog
      ref={ref}
      className={cn(
        'app-dialog rounded-card border border-line-2 bg-card p-0 text-ink shadow-xl',
        className
      )}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="flex max-h-[inherit] flex-col gap-5 overflow-y-auto p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[16px] font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[13.5px] text-pretty text-muted">{description}</p>
            )}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X size={15} />
          </IconButton>
        </div>
        {children}
      </div>
    </dialog>,
    document.body
  )
}
