import { timeAgo } from '~/lib/date'
import { formatMoney, type MoneyFormat } from '~/lib/money'
import type {
  DashboardChange,
  DashboardOverview,
  DashboardRange,
  Gauge,
  Kpi,
  MarketSales,
  MonthlyBar,
  MonthlyStat,
  OrderStatus,
  RecentOrder,
  RegionSales,
  ThingToDo,
  Tone,
} from './_types'

export const RANGE_LABELS: Record<DashboardRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

const COMPACT_FROM = 1000
const REGION_TONES: Tone[] = ['purple', 'ok', 'info', 'warning']

export function moneyFormat(overview: DashboardOverview): MoneyFormat {
  return overview.money
}

/** `+12%`, `-7%`, `0%`, or `New` when the previous value was 0. */
export function formatChange(change: DashboardChange): string {
  if (change.percent === null) return 'New'
  if (change.percent > 0) return `+${change.percent}%`
  return `${change.percent}%`
}

export function formatAmount(amount: number, money: MoneyFormat): string {
  if (Math.abs(amount) < COMPACT_FROM) return formatMoney(amount, money)
  try {
    return new Intl.NumberFormat(money.locale, {
      style: 'currency',
      currency: money.currencyCode,
      currencyDisplay: money.currencyDisplay,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return formatMoney(amount, money)
  }
}

export function formatCount(count: number, locale: string): string {
  if (Math.abs(count) < COMPACT_FROM) return String(count)
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(count)
  } catch {
    return String(count)
  }
}

/** Splits a trailing compact suffix (`₱1.24M` → `₱1.24` + `M`) for the KPI superscript. */
function splitUnit(value: string): { value: string; unit?: string } {
  const match = value.match(/^(.*\d)\s?([KMBT])$/)
  return match ? { value: match[1], unit: match[2] } : { value }
}

function compareLabel(change: DashboardChange): string {
  if (change.percent === null || change.trend === 'up') return 'up from'
  if (change.trend === 'down') return 'down from'
  return 'same as'
}

export function presentKpis(overview: DashboardOverview): Kpi[] {
  const money = moneyFormat(overview)
  const locale = money.locale
  const comparePeriod = `previous ${overview.days} days`
  const kpi = (
    id: Kpi['id'],
    label: string,
    icon: Kpi['icon'],
    tone: Tone,
    change: DashboardChange,
    current: string,
    previous: string
  ): Kpi => ({
    id,
    label,
    icon,
    tone,
    ...splitUnit(current),
    trend: change.trend,
    change: formatChange(change),
    compareLabel: compareLabel(change),
    compareValue: previous,
    comparePeriod,
  })

  return [
    kpi(
      'revenue',
      `Revenue · ${money.currencyCode}`,
      'revenue',
      'ok',
      overview.changes.revenue,
      formatAmount(overview.current.revenue, money),
      formatAmount(overview.previous.revenue, money)
    ),
    kpi(
      'orders',
      'Orders',
      'orders',
      'info',
      overview.changes.orders,
      formatCount(overview.current.orders, locale),
      formatCount(overview.previous.orders, locale)
    ),
    kpi(
      'customers',
      'New customers',
      'customers',
      'purple',
      overview.changes.newCustomers,
      formatCount(overview.current.newCustomers, locale),
      formatCount(overview.previous.newCustomers, locale)
    ),
    kpi(
      'aov',
      'Avg. order value',
      'aov',
      'accent',
      overview.changes.averageOrderValue,
      formatAmount(overview.current.averageOrderValue, money),
      formatAmount(overview.previous.averageOrderValue, money)
    ),
  ]
}

export function presentMarkets(overview: DashboardOverview): MarketSales[] {
  const money = moneyFormat(overview)
  return overview.markets.map((market, index) => {
    const marketMoney = { ...money, currencyCode: market.currencyCode }
    const ordersText = `${formatCount(market.orders, money.locale)} ${market.orders === 1 ? 'order' : 'orders'}`
    return {
      key: `${market.marketId ?? 'other'}-${market.currencyCode}`,
      name: market.name,
      currencyCode: market.currencyCode,
      isPrimary: market.isPrimary,
      value: formatAmount(market.revenue, marketMoney),
      details:
        market.orders > 0
          ? `${ordersText} · avg ${formatAmount(market.averageOrderValue, marketMoney)}`
          : ordersText,
      trend: market.change.trend,
      change: formatChange(market.change),
      tone: REGION_TONES[index % REGION_TONES.length],
    }
  })
}

export function presentRegions(overview: DashboardOverview): RegionSales[] {
  const money = moneyFormat(overview)
  return overview.regions.map((region, index) => ({
    name: region.name,
    value: formatAmount(region.revenue, money),
    percent: region.percent,
    tone: REGION_TONES[index % REGION_TONES.length],
  }))
}

export function presentGauges(overview: DashboardOverview): Gauge[] {
  return [
    {
      label: 'New customers',
      caption: 'first-time buyers',
      percent: overview.gauges.newCustomersPercent,
      tone: 'purple',
    },
    {
      label: 'Repeat purchases',
      caption: 'returning buyers',
      percent: overview.gauges.repeatPercent,
      tone: 'info',
    },
    {
      label: 'Unpaid orders',
      caption: 'awaiting payment',
      percent: overview.gauges.unpaidPercent,
      tone: 'warning',
    },
  ]
}

export function presentMonthlyStats(overview: DashboardOverview): MonthlyStat[] {
  const money = moneyFormat(overview)
  const { month } = overview
  return [
    {
      label: 'Sales growth',
      value: formatChange(month.salesGrowth),
      trend: month.salesGrowth.trend,
      change: `vs ${month.previousLabel}`,
    },
    {
      label: `${month.previousLabel} sales`,
      value: formatAmount(month.previousRevenue, money),
      trend: month.previousRevenueChange.trend,
      change: formatChange(month.previousRevenueChange),
    },
    {
      label: 'Avg. order value',
      value: formatAmount(month.averageOrderValue, money),
      trend: month.averageOrderValueChange.trend,
      change: formatChange(month.averageOrderValueChange),
    },
    {
      label: 'Discounts given',
      value: formatAmount(month.discounts, money),
      trend: month.discountsChange.trend,
      change: formatChange(month.discountsChange),
    },
  ]
}

export function presentMonthlyBars(overview: DashboardOverview): MonthlyBar[] {
  return overview.monthly.map((bar) => ({ month: bar.label, value: Math.max(0, bar.revenue) }))
}

function orderStatus(order: DashboardOverview['recentOrders'][number]): OrderStatus {
  if (order.fulfillmentStatus === 'fulfilled') return 'shipped'
  if (order.paymentStatus === 'paid') return 'paid'
  return 'pending'
}

export function presentRecentOrders(overview: DashboardOverview): RecentOrder[] {
  const money = moneyFormat(overview)
  return overview.recentOrders.map((order) => ({
    id: order.id,
    label: order.orderNumber === null ? '—' : `#${order.orderNumber}`,
    customer: order.customerName ?? order.email ?? 'Guest',
    total: formatMoney(order.total, { ...money, currencyCode: order.currencyCode }),
    status: orderStatus(order),
    placedAt: timeAgo(order.completedAt),
  }))
}

export function presentThingsToDo(overview: DashboardOverview): ThingToDo[] {
  const { todo } = overview
  return [
    {
      id: 'fulfill',
      label: 'Orders to fulfill',
      count: todo.toFulfill,
      route: 'admin.orders.home',
      qs: { fulfillmentStatus: 'unfulfilled' },
    },
    {
      id: 'payments',
      label: 'Bank transfers awaiting payment',
      count: todo.awaitingPayment,
      route: 'admin.orders.home',
      qs: { paymentStatus: 'pending' },
    },
    {
      id: 'payment-proofs',
      label: 'Payment proofs to review',
      count: todo.paymentsToReview,
      route: 'admin.orders.home',
      qs: { paymentStatus: 'payment_submitted' },
    },
    {
      id: 'returns',
      label: 'Return requests to review',
      count: todo.returnsToReview,
      route: 'admin.returns.home',
      qs: { status: 'requested' },
    },
    {
      id: 'stock',
      label: 'Low-stock variants',
      count: todo.lowStock,
      route: 'admin.products.home',
    },
    {
      id: 'reviews',
      label: 'New reviews this week',
      count: todo.newReviews,
      route: 'admin.products.home',
    },
  ]
}

export function headline(overview: DashboardOverview): string {
  const days = overview.days
  const orders = overview.current.orders
  if (orders === 0) {
    return `No orders in the last ${days} days yet. Your numbers will show here as sales come in.`
  }
  const ordersText = `${orders} ${orders === 1 ? 'order' : 'orders'}`
  const change = overview.changes.revenue
  if (change.percent === null) {
    const revenue = formatAmount(overview.current.revenue, moneyFormat(overview))
    return `You made ${revenue} from ${ordersText} in the last ${days} days.`
  }
  const movement =
    change.trend === 'flat' ? 'steady' : `${change.trend} ${Math.abs(change.percent)}%`
  return `Revenue is ${movement} compared with the previous ${days} days, with ${ordersText}.`
}

/** Quotes cells and defuses spreadsheet formulas (region names come from shopper addresses). */
function csvCell(value: string | number): string {
  const raw = String(value)
  const text = typeof value === 'string' && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function dashboardCsv(overview: DashboardOverview): string {
  const money = moneyFormat(overview)
  const rows: (string | number)[][] = [
    ['Section', 'Metric', 'Value'],
    ['Period', 'Range', RANGE_LABELS[overview.range]],
    ['Period', 'Currency', money.currencyCode],
    ['KPIs', 'Revenue', overview.current.revenue.toFixed(2)],
    ['KPIs', 'Revenue (previous period)', overview.previous.revenue.toFixed(2)],
    ['KPIs', 'Orders', overview.current.orders],
    ['KPIs', 'Orders (previous period)', overview.previous.orders],
    ['KPIs', 'New customers', overview.current.newCustomers],
    ['KPIs', 'Average order value', overview.current.averageOrderValue.toFixed(2)],
    ...overview.markets.flatMap((market) => [
      [
        'Sales by market',
        `${market.name} revenue (${market.currencyCode})`,
        market.revenue.toFixed(2),
      ],
      ['Sales by market', `${market.name} orders`, market.orders],
    ]),
    ...overview.regions.map((region) => [
      'Sales by region',
      region.name,
      region.revenue.toFixed(2),
    ]),
    ['Gauges', 'New customers %', overview.gauges.newCustomersPercent],
    ['Gauges', 'Repeat purchases %', overview.gauges.repeatPercent],
    ['Gauges', 'Unpaid orders %', overview.gauges.unpaidPercent],
    ...overview.monthly.map((bar) => ['Monthly sales', bar.month, bar.revenue.toFixed(2)]),
    ['Monthly stats', 'Discounts given this month', overview.month.discounts.toFixed(2)],
    ['Things to do', 'Orders to fulfill', overview.todo.toFulfill],
    ['Things to do', 'Bank transfers awaiting payment', overview.todo.awaitingPayment],
    ['Things to do', 'Payment proofs to review', overview.todo.paymentsToReview],
    ['Things to do', 'Low-stock variants', overview.todo.lowStock],
    ['Things to do', 'New reviews this week', overview.todo.newReviews],
    ['Things to do', 'Return requests to review', overview.todo.returnsToReview],
  ]
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

export function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
