import { Link } from '@adonisjs/inertia/react'
import { ArrowRight } from 'lucide-react'
import { card, cn } from '~/lib/styles'
import RingGauge from './_ring_gauge'
import { toneBg } from './_tones'
import type { Gauge, RegionSales } from './_types'

type SalesByRegionCardProps = {
  regions: RegionSales[]
  gauges: Gauge[]
}

export default function SalesByRegionCard({ regions, gauges }: SalesByRegionCardProps) {
  return (
    <section className={card.base}>
      <div className={card.head}>
        <div>
          <div className={card.eyebrow}>Geography</div>
          <h2 className={card.title}>Sales by region</h2>
        </div>
        <Link route="admin.orders.home" className={card.action}>
          View orders <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1">
        {regions.map((region) => (
          <div key={region.name} className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-2">
              <span className={cn('size-2 shrink-0 rounded-full', toneBg[region.tone])} />
              <span className="truncate">{region.name}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                {region.value}
              </span>
              <span className="font-mono text-[11px] text-subtle">{region.percent}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={region.name}
              aria-valuenow={region.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-500',
                  toneBg[region.tone]
                )}
                style={{ width: `${region.percent}%` }}
              />
            </div>
          </div>
        ))}
        {regions.length === 0 && (
          <p className="col-span-full text-[13.5px] text-muted">
            Regions will show here once orders ship to your customers.
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6 border-t border-line pt-6 max-[900px]:grid-cols-1">
        {gauges.map((gauge) => (
          <RingGauge key={gauge.label} gauge={gauge} />
        ))}
      </div>
    </section>
  )
}
