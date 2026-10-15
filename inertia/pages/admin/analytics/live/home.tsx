import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { BarTrendChart } from '~/components/charts'
import { FormButton } from '~/components/form'
import Page from '~/components/page'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { timeAgo } from '~/lib/date'
import { formatMoney } from '~/lib/money'
import { card, cn } from '~/lib/styles'
import { useAdminAnalyticsLive } from '../_hooks'
import type { AnalyticsLive } from '../_types'

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={cn(card.base, 'flex flex-col gap-2')}>
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums break-words">
        {value}
      </span>
      {hint && <span className="text-[12px] text-subtle">{hint}</span>}
    </div>
  )
}

function LiveBody({ live }: { live: AnalyticsLive }) {
  const count = (value: number) => value.toLocaleString(live.money.locale)

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label="Right now"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className={cn(card.base, 'flex flex-col gap-2 sm:col-span-2 lg:col-span-1')}>
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-muted">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-ok" />
            </span>
            Visitors right now
          </span>
          <span className="text-[40px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {count(live.visitorsNow)}
          </span>
          <span className="text-[12px] text-subtle">
            Active in the last {live.windowMinutes} minutes
          </span>
        </div>
        <Stat label="Sessions today" value={count(live.sessionsToday)} />
        <Stat label="Orders today" value={count(live.ordersToday)} />
        <Stat label="Total sales today" value={formatMoney(live.salesToday, live.money)} />
        <Stat
          label="Active carts"
          value={count(live.activeCarts)}
          hint={`Added to cart in the last ${live.windowMinutes} minutes`}
        />
        <Stat
          label="Checking out"
          value={count(live.activeCheckouts)}
          hint={`Reached checkout in the last ${live.windowMinutes} minutes`}
        />
      </section>

      <section className={card.base}>
        <div className={card.head}>
          <div className="min-w-0">
            <div className={card.eyebrow}>Last 30 minutes</div>
            <h2 className={card.title}>Page views per minute</h2>
          </div>
        </div>
        <BarTrendChart
          label="Page views per minute"
          data={live.minutes}
          xKey="label"
          series={[{ key: 'views', label: 'Page views' }]}
          height={200}
        />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className={card.base}>
          <div className={card.head}>
            <h2 className={card.title}>Top pages right now</h2>
          </div>
          {live.topPages.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-muted">No page views right now.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {live.topPages.map((page) => (
                <li key={page.path} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink-2">
                    {page.path}
                  </span>
                  <span className="shrink-0 text-[13px] tabular-nums text-muted">
                    {count(page.views)} views
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={card.base}>
          <div className={card.head}>
            <h2 className={card.title}>Latest orders</h2>
          </div>
          {live.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-muted">No orders today yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {live.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    route="admin.orders.show"
                    routeParams={{ id: order.id }}
                    className="flex items-center gap-3 py-2.5 hover:underline"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {order.orderNumber ? `#${order.orderNumber}` : 'Order'}
                        {order.customerName ? ` · ${order.customerName}` : ''}
                      </span>
                      <span className="block text-[12px] text-subtle">
                        {timeAgo(order.completedAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13.5px] font-medium tabular-nums">
                      {formatMoney(order.total, {
                        ...live.money,
                        currencyCode: order.currencyCode,
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default function AdminAnalyticsLiveHome() {
  const live = useAdminAnalyticsLive()

  return (
    <Page
      eyebrow={
        <Link
          route="admin.analytics.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Analytics
        </Link>
      }
      title="Live View"
      description="What’s happening on your online store right now. Updates every 15 seconds."
    >
      {live.isPending && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} className="h-28 w-full rounded-card" />
          ))}
        </div>
      )}

      {live.isError && !live.data && (
        <section className={cn(card.base, 'flex flex-wrap items-center justify-between gap-4')}>
          <p className="text-[14px] text-muted">We couldn’t load Live View.</p>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => live.refetch()}>
            <RotateCw size={14} /> Try again
          </FormButton>
        </section>
      )}

      {live.data && <LiveBody live={live.data} />}
    </Page>
  )
}

AdminAnalyticsLiveHome.layout = [AdminLayout]
