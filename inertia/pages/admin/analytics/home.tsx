import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Activity, ArrowRight, FileBarChart, RotateCw } from 'lucide-react'
import { BarTrendChart, FunnelBars } from '~/components/charts'
import { FormButton } from '~/components/form'
import Page from '~/components/page'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, cn } from '~/lib/styles'
import DateRangeControl from './_date_range_control'
import { axisFormatter, formatMetric, rangeText } from './_format'
import { useAdminAnalyticsDashboard } from './_hooks'
import MetricCard from './_metric_card'
import AnalyticsNotes from './_notes'
import ReportLink from './_report_link'
import type { AnalyticsDashboard, AnalyticsQuery } from './_types'
import { useAnalyticsQuery, type AnalyticsShellProps } from './_use_analytics_query'

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading analytics">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div key={key} className={cn(card.base, 'flex flex-col gap-3')}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-14 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    </div>
  )
}

function CardHeader({
  title,
  eyebrow,
  action,
}: {
  title: string
  eyebrow: string
  action?: ReactNode
}) {
  return (
    <div className={card.head}>
      <div className="min-w-0">
        <div className={card.eyebrow}>{eyebrow}</div>
        <h2 className={card.title}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

function Breakdowns({
  dashboard,
  query,
}: {
  dashboard: AnalyticsDashboard
  query: AnalyticsQuery
}) {
  const { money } = dashboard
  const salesBySource = dashboard.salesBySource.map((row) => ({
    label: row.label,
    sales: row.sales,
  }))
  const devices = dashboard.sessionsByDevice

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className={card.base}>
        <CardHeader
          eyebrow="Traffic"
          title="Sales by traffic source"
          action={
            <ReportLink reportKey="sessions_by_source" query={query}>
              View report <ArrowRight size={13} />
            </ReportLink>
          }
        />
        {salesBySource.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] text-muted">No sessions in this period.</p>
        ) : (
          <BarTrendChart
            label="Sales by traffic source"
            data={salesBySource}
            xKey="label"
            series={[{ key: 'sales', label: 'Sales' }]}
            formatValue={axisFormatter('money', money)}
            horizontal
            height={Math.max(160, salesBySource.length * 40)}
          />
        )}
      </section>

      <section className={card.base}>
        <CardHeader
          eyebrow="Shopping behavior"
          title="Conversion funnel"
          action={
            <ReportLink reportKey="conversion_funnel" query={query}>
              View report <ArrowRight size={13} />
            </ReportLink>
          }
        />
        <FunnelBars
          steps={dashboard.funnel.map((step) => ({
            label: step.label,
            value: step.sessions,
            percent: step.percent,
          }))}
        />
      </section>

      <section className={card.base}>
        <CardHeader
          eyebrow="Traffic"
          title="Sessions by device type"
          action={
            <ReportLink reportKey="sessions_by_device" query={query}>
              View report <ArrowRight size={13} />
            </ReportLink>
          }
        />
        {devices.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] text-muted">No sessions in this period.</p>
        ) : (
          <FunnelBars
            steps={devices.map((row) => ({
              label: row.label,
              value: row.sessions,
              percent: row.percent,
            }))}
          />
        )}
      </section>

      <section className={card.base}>
        <CardHeader
          eyebrow="Sales"
          title="Top products"
          action={
            <ReportLink reportKey="sales_by_product" query={query}>
              View report <ArrowRight size={13} />
            </ReportLink>
          }
        />
        {dashboard.topProducts.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] text-muted">No sales in this period.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line">
            {dashboard.topProducts.map((product, index) => (
              <li key={`${product.title}-${index}`} className="flex items-center gap-3 py-2.5">
                <span className="w-5 shrink-0 font-mono text-[12px] text-subtle">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">
                  {product.title}
                </span>
                <span className="shrink-0 text-right font-mono text-[12.5px] text-muted tabular-nums">
                  {product.units.toLocaleString()} sold
                </span>
                <span className="w-24 shrink-0 text-right text-[13.5px] font-medium tabular-nums">
                  {formatMetric(product.sales, 'money', money)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export default function AdminAnalyticsHome(props: AnalyticsShellProps) {
  const { query, setQuery } = useAnalyticsQuery(props, '/admin/analytics')
  const analytics = useAdminAnalyticsDashboard(query)
  const dashboard = analytics.data

  return (
    <Page
      title="Analytics"
      description={
        dashboard
          ? rangeText(dashboard.range)
          : 'Sales, sessions, conversion and customers for your store.'
      }
      actions={
        <>
          <Link
            route="admin.analytics.reports.home"
            className={buttonClasses({ variant: 'secondary' })}
          >
            <FileBarChart size={15} /> Reports
          </Link>
          <Link
            route="admin.analytics.live.home"
            className={buttonClasses({ variant: 'secondary' })}
          >
            <Activity size={15} /> Live View
          </Link>
        </>
      }
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <DateRangeControl value={query} onChange={setQuery} />
        <p className="text-[12.5px] text-subtle">Updates about every minute</p>
      </div>

      {analytics.isPending && <DashboardSkeleton />}

      {analytics.isError && !dashboard && (
        <section className={cn(card.base, 'flex flex-wrap items-center justify-between gap-4')}>
          <p className="text-[14px] text-muted">We couldn’t load your analytics.</p>
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => analytics.refetch()}
          >
            <RotateCw size={14} /> Try again
          </FormButton>
        </section>
      )}

      {dashboard && (
        <div
          className={cn(
            'flex flex-col gap-5 transition-opacity duration-200',
            analytics.isPlaceholderData && 'opacity-60'
          )}
        >
          <AnalyticsNotes notes={dashboard.notes} />
          <section
            aria-label="Key metrics"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {dashboard.cards.map((metric) => (
              <MetricCard key={metric.key} metric={metric} money={dashboard.money} query={query} />
            ))}
          </section>
          <Breakdowns dashboard={dashboard} query={query} />
        </div>
      )}
    </Page>
  )
}

AdminAnalyticsHome.layout = [AdminLayout]
