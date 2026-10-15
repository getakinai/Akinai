import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '~/lib/styles'

type SummaryRowProps = {
  icon: ReactNode
  title: string
  subtitle: ReactNode
  /** Opens the editor. Without it the row is read-only. */
  onEdit?: () => void
}

/**
 * One line of a settings card: icon, title, summary and a chevron that
 * opens the editor.
 */
export default function SummaryRow({ icon, title, subtitle, onEdit }: SummaryRowProps) {
  const content = (
    <>
      <span className="grid size-8 shrink-0 place-items-center text-ink-2">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="text-[14px] font-medium text-ink">{title}</span>
        <span className="text-[13.5px] break-words text-muted">{subtitle}</span>
      </span>
      {onEdit && <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-subtle" />}
    </>
  )

  const base = 'flex w-full min-w-0 items-center gap-3 px-4 py-3.5'

  if (!onEdit) return <div className={base}>{content}</div>

  return (
    <button
      type="button"
      className={cn(
        base,
        'cursor-pointer transition-colors duration-150 hover:bg-paper focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset'
      )}
      aria-label={`Edit ${title.toLowerCase()}`}
      onClick={onEdit}
    >
      {content}
    </button>
  )
}
