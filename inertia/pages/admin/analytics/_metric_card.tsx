import { Link } from '@adonisjs/inertia/react'
import { ArrowRight } from 'lucide-react'
import { LineTrendChart } from '~/components/charts'
import type { MoneyFormat } from '~/lib/money'
import { card, cn } from '~/lib/styles'
import TrendIcon from '../dashboard/_trend_icon'
import { trendSoft } from '../dashboard/_tones'
import { changeText, chartData, chartSeries, formatMetric } from './_format'
import type { AnalyticsDashboardCard, AnalyticsQuery } from './_types'

type MetricCardProps = {
  metric: AnalyticsDashboardCard
  money: MoneyFormat
  query: AnalyticsQuery
}

/** Headline number with its change and a sparkline; the title opens the full report. */
export default function MetricCard({ metric, money, query }: MetricCardProps) {
  const withPrevious = metric.previous !== null
  const series = chartSeries([{ key: 'value', label: metric.label }], withPrevious)

  return (
    <article className={cn(card.base, 'flex flex-col gap-3')}>
      <div className="flex items-start justify-between gap-3">
        <Link
          route="admin.analytics.reports.show"
          routeParams={{ key: metric.reportKey }}
          qs={{ from: query.from, to: query.to, compare: query.compare }}
          className="group inline-flex min-w-0 items-center gap-1 text-[13.5px] font-medium text-ink-2 underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <span className="truncate">{metric.label}</span>
          <ArrowRight
            size={13}
            aria-hidden="true"
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </Link>
        {metric.change && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px]',
              trendSoft[metric.change.trend]
            )}
          >
            <TrendIcon trend={metric.change.trend} size={11} />
            {changeText(metric.change)}
          </span>
        )}
      </div>
      <div className="text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums break-words">
        {formatMetric(metric.value, metric.format, money)}
      </div>
      {withPrevious && (
        <p className="text-[12.5px] text-muted">
          Comparison:{' '}
          <span className="font-mono text-ink-2">
            {formatMetric(metric.previous, metric.format, money)}
          </span>
        </p>
      )}
      <LineTrendChart
        label={`${metric.label} trend`}
        data={chartData(metric.spark)}
        xKey="label"
        series={series}
        height={56}
        minimal
      />
    </article>
  )
}
