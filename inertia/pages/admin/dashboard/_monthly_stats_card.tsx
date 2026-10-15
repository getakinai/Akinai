import { card, cn } from '~/lib/styles'
import { trendText } from './_tones'
import TrendIcon from './_trend_icon'
import type { MonthlyBar, MonthlyStat } from './_types'

type MonthlyStatsCardProps = {
  period: string
  stats: MonthlyStat[]
  bars: MonthlyBar[]
}

export default function MonthlyStatsCard({ period, stats, bars }: MonthlyStatsCardProps) {
  const max = Math.max(...bars.map((bar) => bar.value), 1)

  return (
    <section className={card.base}>
      <div className={card.head}>
        <div>
          <div className={card.eyebrow}>Performance</div>
          <h2 className={card.title}>Monthly stats</h2>
        </div>
        <span className={card.action}>{period}</span>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card p-4">
            <div className="text-[12.5px] text-muted">{stat.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[22px] leading-none font-semibold tracking-[-0.02em]">
                {stat.value}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-mono text-[11px]',
                  trendText[stat.trend]
                )}
              >
                <TrendIcon trend={stat.trend} size={11} />
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex h-32 items-end gap-3" role="img" aria-label="Monthly sales chart">
        {bars.map((bar, index) => (
          <div
            key={bar.month}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div
              className={cn(
                'min-h-1 w-full max-w-9 rounded-t-md transition-[height] duration-500',
                index === bars.length - 1 ? 'bg-accent' : 'bg-accent-soft'
              )}
              style={{ height: `${(bar.value / max) * 100}%` }}
            />
            <span className="font-mono text-[10.5px] text-subtle">{bar.month}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
