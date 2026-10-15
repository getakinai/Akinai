import { Link } from '@adonisjs/inertia/react'
import { ArrowRight } from 'lucide-react'
import { card, cn } from '~/lib/styles'
import { toneBg, trendSoft } from './_tones'
import TrendIcon from './_trend_icon'
import type { MarketSales } from './_types'

type SalesByMarketCardProps = {
  markets: MarketSales[]
  comparePeriod: string
  canViewMarkets: boolean
}

export default function SalesByMarketCard({
  markets,
  comparePeriod,
  canViewMarkets,
}: SalesByMarketCardProps) {
  return (
    <section className={card.base}>
      <div className={card.head}>
        <div>
          <div className={card.eyebrow}>Markets</div>
          <h2 className={card.title}>Sales by market</h2>
        </div>
        {canViewMarkets && (
          <Link route="admin.markets.home" className={card.action}>
            View markets <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 min-[1100px]:grid-cols-4">
        {markets.map((market) => (
          <li key={market.key} className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-2">
              <span className={cn('size-2 shrink-0 rounded-full', toneBg[market.tone])} />
              <span className="truncate">{market.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-subtle">
                {market.currencyCode}
              </span>
              {market.isPrimary && (
                <span className="shrink-0 rounded-md bg-line px-1.5 py-0.5 font-mono text-[10px] text-muted uppercase">
                  Primary
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[24px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                {market.value}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px]',
                  trendSoft[market.trend]
                )}
                title={`vs ${comparePeriod}`}
              >
                <TrendIcon trend={market.trend} size={11} />
                {market.change}
              </span>
            </div>
            <p className="text-[12.5px] text-muted">{market.details}</p>
          </li>
        ))}
        {markets.length === 0 && (
          <li className="col-span-full text-[13.5px] text-muted">
            Markets will show here once you set one up and orders come in.
          </li>
        )}
      </ul>

      <p className="mt-5 text-[12px] text-subtle">
        Each market is shown in its own currency and compared with the {comparePeriod}.
      </p>
    </section>
  )
}
