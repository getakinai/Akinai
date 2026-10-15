import { cn } from '~/lib/styles'

export type FunnelStep = {
  label: string
  value: number
  /** 0–100, share of the first step. */
  percent: number
  previousValue?: number | null
}

type FunnelBarsProps = {
  steps: FunnelStep[]
  formatValue?: (value: number) => string
  className?: string
}

/** Horizontal bars for each funnel step, sized by their share of the first step. */
export default function FunnelBars({ steps, formatValue, className }: FunnelBarsProps) {
  const format = (value: number) => (formatValue ? formatValue(value) : value.toLocaleString())
  return (
    <ol className={cn('flex flex-col gap-3', className)}>
      {steps.map((step) => (
        <li key={step.label} className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[13px]">
            <span className="min-w-0 truncate font-medium text-ink-2">{step.label}</span>
            <span className="font-mono text-[12px] text-muted tabular-nums">
              {format(step.value)}
              <span className="text-subtle"> · {step.percent.toLocaleString()}%</span>
              {step.previousValue !== undefined && step.previousValue !== null && (
                <span className="text-subtle"> (was {format(step.previousValue)})</span>
              )}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(100, step.percent))}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
