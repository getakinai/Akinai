import { Receipt, ShoppingBag, Users, Wallet } from 'lucide-react'
import { card, cn } from '~/lib/styles'
import { toneSoft, trendSoft, trendText } from './_tones'
import TrendIcon from './_trend_icon'
import type { Kpi } from './_types'

const icons = {
  revenue: Wallet,
  orders: ShoppingBag,
  customers: Users,
  aov: Receipt,
}

export default function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = icons[kpi.icon]

  return (
    <article
      className={cn(
        card.base,
        'flex flex-col gap-4 transition-[translate,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(10,10,11,0.35)]'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn('grid size-8 place-items-center rounded-lg', toneSoft[kpi.tone])}>
            <Icon size={16} aria-hidden="true" />
          </span>
          <span className="text-[13.5px] font-medium text-ink-2">{kpi.label}</span>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px]',
            trendSoft[kpi.trend]
          )}
        >
          <TrendIcon trend={kpi.trend} size={11} />
          {kpi.change}
        </span>
      </div>

      <div className="text-[38px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {kpi.value}
        {kpi.unit && (
          <sup className="ml-0.5 align-super text-[15px] font-medium text-muted">{kpi.unit}</sup>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3 text-[12.5px] text-muted">
        <span className={trendText[kpi.trend]}>
          <TrendIcon trend={kpi.trend} />
        </span>
        {kpi.compareLabel}
        <span className="font-mono font-medium text-ink">{kpi.compareValue}</span>
        <span className="text-subtle">·</span>
        {kpi.comparePeriod}
      </div>
    </article>
  )
}
