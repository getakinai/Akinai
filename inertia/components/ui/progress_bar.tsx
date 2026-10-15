import { cn } from '~/lib/styles'

type ProgressBarProps = {
  label: string
  /** 0 to 100; null shows an indeterminate bar. */
  percent: number | null
  className?: string
}

/** A labelled native progress bar (no inline styles, so it is CSP-friendly). */
export default function ProgressBar({ label, percent, className }: ProgressBarProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)} role="status">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate text-ink">{label}</span>
        {percent !== null && <span className="font-mono text-muted">{Math.round(percent)}%</span>}
      </div>
      <progress
        aria-label={label}
        max={100}
        value={percent ?? undefined}
        className="h-2 w-full appearance-none overflow-hidden rounded-full bg-line [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-btn [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-btn [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-300"
      />
    </div>
  )
}
