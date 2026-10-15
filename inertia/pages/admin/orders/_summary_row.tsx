import { type ReactNode } from 'react'
import { cn } from '~/lib/styles'

type SummaryRowProps = {
  label: ReactNode
  detail?: ReactNode
  amount: ReactNode
  strong?: boolean
  error?: string
}

/** One row of an order's payment summary: label, optional detail, amount. */
export default function SummaryRow({
  label,
  detail,
  amount,
  strong = false,
  error,
}: SummaryRowProps) {
  return (
    <div className="py-2">
      <div
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 text-[14px] sm:grid-cols-[160px_minmax(0,1fr)_auto]',
          strong ? 'font-semibold text-ink' : 'text-ink-2'
        )}
      >
        <span className="min-w-0">{label}</span>
        <span className="order-3 col-span-2 min-w-0 truncate text-[13px] text-muted sm:order-none sm:col-span-1">
          {detail}
        </span>
        <span className="text-right whitespace-nowrap">{amount}</span>
      </div>
      {error && <p className="mt-1 text-[12.5px] text-danger">{error}</p>}
    </div>
  )
}
