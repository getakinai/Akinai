import { type InputHTMLAttributes, useId } from 'react'
import { cn } from '~/lib/styles'

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  tone?: 'default' | 'storefront'
}

/**
 * Toggle switch (visually replaces a checkbox). Keeps a native checkbox input
 * for the same `onChange` / `checked` API as `Checkbox`.
 */
export default function Switch({
  tone = 'default',
  className,
  id,
  disabled,
  ...props
}: SwitchProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  const trackOn = tone === 'storefront' ? 'peer-checked:bg-sf-primary' : 'peer-checked:bg-accent'
  const thumbOn =
    tone === 'storefront' ? 'peer-checked:border-sf-primary/20' : 'peer-checked:border-accent/20'

  return (
    <span
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0',
        disabled && 'cursor-not-allowed opacity-55',
        className
      )}
    >
      <input
        {...props}
        id={inputId}
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none block h-full w-full rounded-full border border-transparent bg-line-2 transition-colors duration-200',
          tone === 'storefront' && 'bg-sf-line',
          trackOn,
          'peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:outline-none',
          'peer-disabled:opacity-55'
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-0.5 left-0.5 size-6 rounded-full border border-line-2 bg-card shadow-sm transition-transform duration-200',
          thumbOn,
          'peer-checked:translate-x-5'
        )}
      />
    </span>
  )
}
