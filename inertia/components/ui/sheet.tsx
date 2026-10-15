import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '~/lib/styles'
import IconButton from './icon_button'

type SheetProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  id?: string
  className?: string
  children: ReactNode
}

/**
 * Panel that slides in from the right, built on the native `<dialog>` like
 * `Dialog`: focus trapping, Escape to close and the backdrop come from the
 * browser.
 */
export default function Sheet({
  open,
  onClose,
  title,
  description,
  id,
  className,
  children,
}: SheetProps) {
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
      id={id}
      className={cn('app-sheet border-l border-line-2 bg-card text-ink shadow-xl', className)}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex h-full flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>
      </div>
    </dialog>,
    document.body
  )
}
