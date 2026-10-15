import { useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '~/lib/styles'

type SectionProps = {
  title?: string
  description?: ReactNode
  children: ReactNode
  /**
   * Makes the header a toggle. `open` controls whether the body shows;
   * `onToggle` is called when the header is clicked.
   */
  collapsible?: { open: boolean; onToggle: () => void }
}

/**
 * A group of content within a page, such as a group of form fields, with
 * an optional title and description. Stack several sections and they are
 * separated by a divider.
 */
export default function Section({ title, description, children, collapsible }: SectionProps) {
  const bodyId = useId()
  const hasHeader = Boolean(title || description)
  const open = collapsible ? collapsible.open : true

  const heading = (
    <>
      {title && <h2 className="text-[15px] font-[560] tracking-[-0.01em]">{title}</h2>}
      {description && <p className="mt-0.5 text-[13.5px] text-pretty text-muted">{description}</p>}
    </>
  )

  return (
    <section className="[section+&]:mt-6 [section+&]:border-t [section+&]:border-line [section+&]:pt-6">
      {hasHeader &&
        (collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={collapsible.onToggle}
            className="flex w-full min-w-0 items-start justify-between gap-3 rounded-md text-left focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="min-w-0">{heading}</span>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex-none text-muted motion-safe:transition-transform motion-safe:duration-200',
                open && 'rotate-180'
              )}
            />
          </button>
        ) : (
          <header>{heading}</header>
        ))}
      {open && (
        <div id={bodyId} className={cn('flex flex-col gap-5', hasHeader && 'mt-[18px]')}>
          {children}
        </div>
      )}
    </section>
  )
}
