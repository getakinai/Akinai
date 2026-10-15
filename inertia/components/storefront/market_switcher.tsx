import { cn } from '~/lib/styles'

export type MarketSwitcherOption = {
  value: string
  /** Short label shown on the button, e.g. the country code. */
  label: string
  /** Full name for screen readers, e.g. "Australia (AUD)". */
  title: string
}

type MarketSwitcherProps = {
  options: MarketSwitcherOption[]
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

/**
 * Segmented control for the country/market the shopper buys in. Renders
 * nothing when there is only one option.
 */
export default function MarketSwitcher({
  options,
  value,
  onChange,
  disabled,
  className,
}: MarketSwitcherProps) {
  if (options.length < 2) return null

  return (
    <div
      role="group"
      aria-label="Shopping from"
      className={cn(
        'inline-flex h-10 flex-none items-center rounded-lg border border-sf-line bg-sf-surface p-0.5',
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.title}
            title={option.title}
            disabled={disabled}
            onClick={() => !selected && onChange(option.value)}
            className={cn(
              'h-full min-w-9 rounded-md px-2 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-wait',
              selected
                ? 'bg-sf-primary text-sf-primary-fg'
                : 'text-sf-text hover:bg-sf-primary-soft'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
