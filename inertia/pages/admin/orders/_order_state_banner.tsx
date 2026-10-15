import {
  Ban,
  CircleCheck,
  CircleDot,
  CircleSlash,
  Clock,
  FilePen,
  FileSearch,
  RotateCcw,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { badgeTones, cn } from '~/lib/styles'
import { type OrderState, orderStateMeta } from './_format'

const stateIcons: Record<OrderState, LucideIcon> = {
  draft: FilePen,
  pending: Clock,
  payment_submitted: FileSearch,
  paid: CircleCheck,
  open: CircleDot,
  cancelled: Ban,
  partially_refunded: Undo2,
  refunded: RotateCcw,
  voided: CircleSlash,
}

type OrderStateBannerProps = {
  state: OrderState
  bankReference?: string | null
}

export default function OrderStateBanner({ state, bankReference }: OrderStateBannerProps) {
  const meta = orderStateMeta[state]
  const Icon = stateIcons[state]

  return (
    <section
      role="status"
      className={cn(
        'flex min-w-0 flex-wrap items-start gap-3 rounded-card border border-line-2 p-4 sm:flex-nowrap sm:items-center sm:gap-4 sm:p-5',
        badgeTones[meta.tone]
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase opacity-80">
          Order status
        </span>
        <p className="text-[18px] leading-tight font-semibold">{meta.label}</p>
        <p className="text-[13px] text-ink-2">{meta.description}</p>
      </div>
      {bankReference && (
        <div className="flex w-full min-w-0 flex-col gap-0.5 rounded-lg bg-card px-3 py-2 sm:w-auto sm:shrink-0 sm:text-right">
          <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase opacity-80">
            Bank reference
          </span>
          <span className="font-mono text-[18px] leading-tight font-semibold break-all text-ink select-all">
            {bankReference}
          </span>
        </div>
      )}
    </section>
  )
}
