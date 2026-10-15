import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '~/lib/styles'

export type TabItem<T extends string> = {
  id: T
  label: ReactNode
  /** Shows a dot so users can find fields with errors on another tab. */
  invalid?: boolean
}

type TabsProps<T extends string> = {
  idPrefix: string
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

export const tabId = (idPrefix: string, id: string) => `${idPrefix}-tab-${id}`

export const tabPanelId = (idPrefix: string, id: string) => `${idPrefix}-panel-${id}`

/**
 * Controlled tab bar (WAI-ARIA tabs with arrow/Home/End keys). Scrolls
 * sideways inside itself on narrow screens. Pair with `TabPanel`.
 */
export default function Tabs<T extends string>({
  idPrefix,
  tabs,
  value,
  onChange,
  label,
  className,
}: TabsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>())

  function focusTab(index: number) {
    const tab = tabs[(index + tabs.length) % tabs.length]
    onChange(tab.id)
    refs.current.get(tab.id)?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    focusTab(moves[event.key])
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex max-w-full min-w-0 gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) refs.current.set(tab.id, element)
              else refs.current.delete(tab.id)
            }}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={tabPanelId(idPrefix, tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              '-mb-px inline-flex h-10 flex-none items-center gap-2 border-b-2 px-3 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:rounded-t-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
              selected
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:border-line-2 hover:text-ink'
            )}
          >
            {tab.label}
            {tab.invalid && (
              <span className="size-1.5 rounded-full bg-danger" aria-label="has errors" />
            )}
          </button>
        )
      })}
    </div>
  )
}

type TabPanelProps = {
  idPrefix: string
  id: string
  active: boolean
  children: ReactNode
  className?: string
}

/**
 * Stays mounted while hidden so form state and editor refs survive tab
 * switches.
 */
export function TabPanel({ idPrefix, id, active, children, className }: TabPanelProps) {
  return (
    <div
      id={tabPanelId(idPrefix, id)}
      role="tabpanel"
      aria-labelledby={tabId(idPrefix, id)}
      hidden={!active}
      className={className}
    >
      {children}
    </div>
  )
}
