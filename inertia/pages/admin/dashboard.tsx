import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowRight, Download, RotateCw } from 'lucide-react'
import Page from '~/components/page'
import { FormButton } from '~/components/form'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, cn } from '~/lib/styles'
import { useDateFormat } from '~/hooks/use_date_format'
import { useAdminMe, useCan } from './_hooks'
import { useAdminDashboard } from './dashboard/_hooks'
import KpiCard from './dashboard/_kpi_card'
import MonthlyStatsCard from './dashboard/_monthly_stats_card'
import {
  RANGE_LABELS,
  dashboardCsv,
  downloadCsv,
  headline,
  presentGauges,
  presentKpis,
  presentMarkets,
  presentMonthlyBars,
  presentMonthlyStats,
  presentRecentOrders,
  presentRegions,
  presentThingsToDo,
} from './dashboard/_present'
import RecentOrdersCard from './dashboard/_recent_orders_card'
import SalesByMarketCard from './dashboard/_sales_by_market_card'
import SalesByRegionCard from './dashboard/_sales_by_region_card'
import ThingsToDoCard from './dashboard/_things_to_do_card'
import { DASHBOARD_RANGES, type DashboardRange } from './dashboard/_types'

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-4 gap-5 max-[1200px]:grid-cols-2 max-[560px]:grid-cols-1">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className={cn(card.base, 'flex flex-col gap-4')}>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div className={cn(card.base, 'flex flex-col gap-4')}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className={cn(card.base, 'flex flex-col gap-4')}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
        <div className={cn(card.base, 'flex flex-col gap-4')}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className={cn(card.base, 'flex flex-col gap-4')}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { formatLongDate } = useDateFormat()
  const { data: user, isLoading, isError } = useAdminMe()
  const canViewOrders = useCan('orders.view')
  const canViewMarkets = useCan('markets.view')
  const [range, setRange] = useState<DashboardRange>('7d')
  const dashboard = useAdminDashboard(range, canViewOrders)
  const overview = dashboard.data
  const firstName = user ? (user.fullName?.split(' ')[0] ?? user.email) : null

  const onExport = () => {
    if (!overview) return
    downloadCsv(`dashboard-${overview.range}.csv`, dashboardCsv(overview))
  }

  return (
    <Page title="Dashboard" hideTitle>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 motion-safe:animate-chunk-rise">
        <div className="max-w-[560px] min-w-0">
          <div
            className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase"
            suppressHydrationWarning
          >
            {formatLongDate(new Date()).replace(/,/g, ' ·')}
          </div>
          <h1 className="mt-2 text-[32px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance max-[720px]:text-[26px]">
            {isLoading && 'Loading…'}
            {isError && 'Welcome back'}
            {firstName && (
              <>
                Welcome back, <span className="text-accent">{firstName}</span>
              </>
            )}
          </h1>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-pretty text-muted">
            {!canViewOrders && user && 'Your role can’t see store sales. Ask an admin for access.'}
            {canViewOrders && (overview ? headline(overview) : 'Gathering your store numbers…')}
          </p>
        </div>
        {canViewOrders && (
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:items-end">
            <div
              role="group"
              aria-label="Date range"
              className="inline-flex w-full rounded-lg border border-line-2 bg-card p-0.5 sm:w-auto"
            >
              {DASHBOARD_RANGES.map((value) => (
                <FormButton
                  key={value}
                  type="button"
                  size="sm"
                  variant={range === value ? 'primary' : 'ghost'}
                  aria-pressed={range === value}
                  className="h-[30px]! flex-1 sm:flex-none"
                  onClick={() => setRange(value)}
                >
                  {RANGE_LABELS[value].replace('Last ', '')}
                </FormButton>
              ))}
            </div>
            <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
              <FormButton type="button" variant="secondary" disabled={!overview} onClick={onExport}>
                <Download size={15} /> Export
              </FormButton>
              <Link
                route="admin.orders.home"
                className={buttonClasses({ className: 'bg-accent! text-paper!' })}
              >
                View orders <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {canViewOrders && dashboard.isPending && <DashboardSkeleton />}

      {canViewOrders && dashboard.isError && !overview && (
        <section className={cn(card.base, 'flex flex-wrap items-center justify-between gap-4')}>
          <p className="text-[14px] text-muted">We couldn’t load your store numbers.</p>
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => dashboard.refetch()}
          >
            <RotateCw size={14} /> Try again
          </FormButton>
        </section>
      )}

      {overview && (
        <div
          className={cn(
            'flex flex-col gap-5 transition-opacity duration-200',
            dashboard.isPlaceholderData && 'opacity-60'
          )}
        >
          <section
            aria-label="Key metrics"
            className="grid grid-cols-4 gap-5 max-[1200px]:grid-cols-2 max-[560px]:grid-cols-1"
          >
            {presentKpis(overview).map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </section>

          <SalesByMarketCard
            markets={presentMarkets(overview)}
            comparePeriod={`previous ${overview.days} days`}
            canViewMarkets={canViewMarkets}
          />

          <SalesByRegionCard regions={presentRegions(overview)} gauges={presentGauges(overview)} />

          <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
            <MonthlyStatsCard
              period={overview.month.label}
              stats={presentMonthlyStats(overview)}
              bars={presentMonthlyBars(overview)}
            />
            <ThingsToDoCard items={presentThingsToDo(overview)} />
          </div>

          <RecentOrdersCard orders={presentRecentOrders(overview)} />
        </div>
      )}
    </Page>
  )
}

AdminDashboard.layout = [AdminLayout]
