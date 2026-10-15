import { type ReactNode } from 'react'
import InfoTooltip from '~/components/ui/info_tooltip'
import Switch, { type SwitchProps } from '~/components/ui/switch'
import { cn, field } from '~/lib/styles'

type FormSwitchProps = Omit<SwitchProps, 'id'> & {
  name: string
  label: string
  hint?: string
  error?: string
  /** Extra help shown in an info tooltip next to the label. */
  tooltip?: ReactNode
}

/** Label on the left, switch on the right — suited to checkout and account toggles. */
export default function FormSwitch({
  name,
  label,
  hint,
  error,
  tooltip,
  tone,
  ...props
}: FormSwitchProps) {
  return (
    <div className={field.wrapper}>
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex min-w-0 flex-1 items-center gap-1">
          <label
            className={cn('text-[13.5px]', tone === 'storefront' ? 'text-sf-text' : 'text-ink')}
            htmlFor={name}
          >
            {label}
          </label>
          {tooltip && <InfoTooltip label={`About ${label.toLowerCase()}`}>{tooltip}</InfoTooltip>}
        </div>
        <Switch
          id={name}
          name={name}
          tone={tone}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={hint ? `${name}-hint` : undefined}
          {...props}
        />
      </div>
      {hint && (
        <span id={`${name}-hint`} className="text-[12.5px] text-muted">
          {hint}
        </span>
      )}
      {error && <span className={field.error}>{error}</span>}
    </div>
  )
}
