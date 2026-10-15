import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '~/lib/styles'

type InfoTooltipProps = {
  /** Read by screen readers as the button's name, e.g. "About the cancel URL". */
  label: string
  children: ReactNode
  className?: string
}

/**
 * An info icon that shows extra help on hover or keyboard focus, and
 * toggles on tap for touch screens. Escape or a tap outside closes it.
 * The bubble spans the nearest `relative` ancestor (e.g. the label row),
 * so it never sticks out of narrow containers.
 */
export default function InfoTooltip({ label, children, className }: InfoTooltipProps) {
  const id = useId()
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const open = pinned || hovered

  useEffect(() => {
    if (!pinned) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPinned(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPinned(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pinned])

  return (
    <span
      ref={rootRef}
      className={cn('inline-flex align-middle', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
        onClick={() => setPinned((current) => !current)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute top-full left-0 z-50 mt-1.5 w-full max-w-sm rounded-lg border border-line bg-card p-2.5 text-[12.5px] leading-snug font-normal break-words text-ink-2 shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  )
}
