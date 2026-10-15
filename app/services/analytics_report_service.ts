import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { countryName } from '#constants/countries'
import {
  ANALYTICS_LIVE_WINDOW_MINUTES,
  ANALYTICS_REPORT_ROWS,
  ANALYTICS_TOP_ROWS,
  type AnalyticsCompare,
  type AnalyticsGrain,
} from '#constants/analytics'
import {
  ANALYTICS_REPORT_CATEGORIES,
  ANALYTICS_REPORTS,
  analyticsReport,
  type AnalyticsReportKey,
} from '#constants/analytics_reports'
import { LOW_STOCK_THRESHOLD } from '#constants/dashboard'
import AnalyticsRepository, { type SalesBucketRow } from '#repositories/analytics_repository'
import AnalyticsSessionRepository from '#repositories/analytics_session_repository'
import DashboardRepository from '#repositories/dashboard_repository'
import { compareChange, type DashboardChange } from '#services/dashboard_service'
import StoreSettingService from '#services/store_setting_service'
import {
  bucketKey,
  bucketLabel,
  bucketStarts,
  resolveAnalyticsRange,
  type AnalyticsRange,
  type AnalyticsRangeInput,
} from '#utils/analytics_range'
import type { MoneyFormat } from '#utils/money'

export type MetricFormat = 'money' | 'number' | 'percent' | 'hours' | 'text'

export type AnalyticsMoney = MoneyFormat

export type AnalyticsRangeInfo = {
  from: string
  to: string
  compare: AnalyticsCompare
  grain: AnalyticsGrain
  previousFrom: string | null
  previousTo: string | null
  trackingStartedAt: string | null
}

export type AnalyticsMetric = {
  key: string
  label: string
  format: MetricFormat
  value: number
  previous: number | null
  change: DashboardChange | null
}

export type AnalyticsSeries = { key: string; label: string; format: MetricFormat }

export type AnalyticsPoint = {
  label: string
  values: Record<string, number>
  previous: Record<string, number> | null
}

export type AnalyticsChart = {
  type: 'line' | 'bar' | 'funnel'
  series: AnalyticsSeries[]
  points: AnalyticsPoint[]
}

export type AnalyticsColumn = {
  key: string
  label: string
  format: MetricFormat
  /** Row key holding the currency of a money cell, when rows mix currencies. */
  currencyKey?: string
}

export type AnalyticsRow = Record<string, string | number | null>

export type AnalyticsReport = {
  key: AnalyticsReportKey
  category: string
  title: string
  description: string
  usesSessions: boolean
  ignoresRange: boolean
  range: AnalyticsRangeInfo
  money: AnalyticsMoney
  summary: AnalyticsMetric[]
  chart: AnalyticsChart | null
  columns: AnalyticsColumn[]
  rows: AnalyticsRow[]
  notes: string[]
}

export type AnalyticsDashboardCard = AnalyticsMetric & {
  reportKey: AnalyticsReportKey
  spark: AnalyticsPoint[]
}

export type AnalyticsDashboard = {
  range: AnalyticsRangeInfo
  money: AnalyticsMoney
  cards: AnalyticsDashboardCard[]
  salesBySource: { label: string; sessions: number; orders: number; sales: number }[]
  sessionsByDevice: { label: string; sessions: number; percent: number }[]
  topProducts: { title: string; units: number; sales: number }[]
  funnel: { label: string; sessions: number; percent: number }[]
  notes: string[]
}

export type AnalyticsLive = {
  generatedAt: string
  money: AnalyticsMoney
  windowMinutes: number
  visitorsNow: number
  sessionsToday: number
  ordersToday: number
  salesToday: number
  activeCarts: number
  activeCheckouts: number
  topPages: { path: string; views: number }[]
  minutes: { label: string; views: number }[]
  recentOrders: {
    id: string
    orderNumber: number | null
    customerName: string | null
    total: number
    currencyCode: string
    completedAt: string
  }[]
}

export type AnalyticsCatalog = {
  categories: {
    key: string
    label: string
    available: boolean
    reports: { key: string; title: string; description: string; createdBy: string }[]
  }[]
}

type Context = {
  range: AnalyticsRange
  timezone: string
  currencyCode: string
  buckets: DateTime[]
  previousBuckets: DateTime[] | null
}

type Section = Pick<AnalyticsReport, 'summary' | 'chart' | 'columns' | 'rows'> & {
  notes?: string[]
}

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct',
  search: 'Search',
  social: 'Social',
  email: 'Email',
  referral: 'Referral',
  paid: 'Paid',
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  stripe: 'Card (Stripe)',
  poli: 'POLi',
}

export function humanize(value: string | null | undefined, fallback = '(none)'): string {
  if (!value) return fallback
  const text = value.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function ratePercent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 1000) / 10
}

const toDate = (value: DateTime) => value.toJSDate()

const sum = <T>(rows: T[], pick: (row: T) => number) =>
  rows.reduce((total, row) => total + pick(row), 0)

const metric = (
  key: string,
  label: string,
  format: MetricFormat,
  value: number,
  previous: number | null
): AnalyticsMetric => ({
  key,
  label,
  format,
  value,
  previous,
  change: previous === null ? null : compareChange(value, previous),
})

const netSales = (row: Pick<SalesBucketRow, 'gross' | 'discounts' | 'returns'>) =>
  row.gross - row.discounts - row.returns

function timeChart<T extends { bucket: string }>(
  context: Context,
  type: 'line' | 'bar',
  series: AnalyticsSeries[],
  current: T[],
  previous: T[] | null,
  values: (row: T | undefined) => Record<string, number>
): AnalyticsChart {
  const currentByBucket = new Map(current.map((row) => [row.bucket, row]))
  const previousByBucket = new Map((previous ?? []).map((row) => [row.bucket, row]))
  const { grain, days } = context.range
  return {
    type,
    series,
    points: context.buckets.map((start, index) => {
      const previousStart = context.previousBuckets?.[index]
      return {
        label: bucketLabel(start, grain, days),
        values: values(currentByBucket.get(bucketKey(start))),
        previous:
          previous && previousStart ? values(previousByBucket.get(bucketKey(previousStart))) : null,
      }
    }),
  }
}

function barChart(
  series: AnalyticsSeries[],
  points: { label: string; values: Record<string, number> }[]
): AnalyticsChart {
  return {
    type: 'bar',
    series,
    points: points.slice(0, ANALYTICS_TOP_ROWS).map((point) => ({ ...point, previous: null })),
  }
}

function periodRows<T extends { bucket: string }>(
  context: Context,
  rows: T[],
  values: (row: T | undefined) => AnalyticsRow
): AnalyticsRow[] {
  const byBucket = new Map(rows.map((row) => [row.bucket, row]))
  const { grain, days } = context.range
  return context.buckets.map((start) => ({
    period: bucketLabel(start, grain, days),
    ...values(byBucket.get(bucketKey(start))),
  }))
}

const PERIOD_COLUMN: AnalyticsColumn = { key: 'period', label: 'Period', format: 'text' }

/**
 * Builds the analytics dashboard, the prebuilt reports and Live View from
 * orders (same rules as the Home dashboard: placed orders, net of refunds,
 * store currency) and first-party storefront sessions.
 */
@inject()
export default class AnalyticsReportService {
  constructor(
    protected analyticsRepository: AnalyticsRepository,
    protected analyticsSessionRepository: AnalyticsSessionRepository,
    protected dashboardRepository: DashboardRepository,
    protected storeSettingService: StoreSettingService
  ) {}

  catalog(): AnalyticsCatalog {
    return {
      categories: ANALYTICS_REPORT_CATEGORIES.map((category) => ({
        key: category.key,
        label: category.label,
        available: category.available,
        reports: ANALYTICS_REPORTS.filter((report) => report.category === category.key).map(
          (report) => ({
            key: report.key,
            title: report.title,
            description: report.description,
            createdBy: 'Store',
          })
        ),
      })),
    }
  }

  async dashboard(input: AnalyticsRangeInput): Promise<AnalyticsDashboard> {
    const { context, money, info, trackingStartedAt } = await this.prepare(input)
    const { range } = context
    const [from, end] = [toDate(range.from), toDate(range.end)]
    const previous = range.previousFrom && range.previousEnd
    const prevFrom = range.previousFrom ? toDate(range.previousFrom) : null
    const prevEnd = range.previousEnd ? toDate(range.previousEnd) : null

    const [
      sales,
      previousSales,
      sessions,
      previousSessions,
      sessionTotals,
      previousSessionTotals,
      buyers,
      previousBuyers,
      buyerBuckets,
      previousBuyerBuckets,
      bySource,
      byDevice,
      topProducts,
    ] = await Promise.all([
      this.salesSeries(context, from, end),
      previous ? this.salesSeries(context, prevFrom!, prevEnd!) : null,
      this.analyticsSessionRepository.series(from, end, range.grain, context.timezone),
      previous
        ? this.analyticsSessionRepository.series(prevFrom!, prevEnd!, range.grain, context.timezone)
        : null,
      this.analyticsSessionRepository.totals(from, end),
      previous ? this.analyticsSessionRepository.totals(prevFrom!, prevEnd!) : null,
      this.buyerTotals(context, from, end),
      previous ? this.buyerTotals(context, prevFrom!, prevEnd!) : null,
      this.buyerSeries(context, from, end),
      previous ? this.buyerSeries(context, prevFrom!, prevEnd!) : null,
      this.analyticsRepository.salesBySource(from, end, context.currencyCode),
      this.analyticsSessionRepository.countBy('device_type', from, end, ANALYTICS_TOP_ROWS),
      this.analyticsRepository.productSales(from, end, context.currencyCode, 5),
    ])

    const totalSales = sum(sales, (row) => row.total)
    const orders = sum(sales, (row) => row.orders)
    const previousTotalSales = previousSales ? sum(previousSales, (row) => row.total) : null
    const previousOrders = previousSales ? sum(previousSales, (row) => row.orders) : null
    const aov = (total: number, count: number) => (count > 0 ? total / count : 0)
    const returningRate = (row: { newCustomers: number; returningCustomers: number }) =>
      ratePercent(row.returningCustomers, row.newCustomers + row.returningCustomers)

    const cards: AnalyticsDashboardCard[] = [
      {
        ...metric('total_sales', 'Total sales', 'money', totalSales, previousTotalSales),
        reportKey: 'sales_over_time',
        spark: timeChart(context, 'line', [], sales, previousSales, (row) => ({
          value: row?.total ?? 0,
        })).points,
      },
      {
        ...metric(
          'sessions',
          'Sessions',
          'number',
          sessionTotals.sessions,
          previousSessionTotals?.sessions ?? null
        ),
        reportKey: 'sessions_over_time',
        spark: timeChart(context, 'line', [], sessions, previousSessions, (row) => ({
          value: row?.sessions ?? 0,
        })).points,
      },
      {
        ...metric(
          'conversion_rate',
          'Conversion rate',
          'percent',
          ratePercent(sessionTotals.converted, sessionTotals.sessions),
          previousSessionTotals
            ? ratePercent(previousSessionTotals.converted, previousSessionTotals.sessions)
            : null
        ),
        reportKey: 'conversion_over_time',
        spark: timeChart(context, 'line', [], sessions, previousSessions, (row) => ({
          value: ratePercent(row?.converted ?? 0, row?.sessions ?? 0),
        })).points,
      },
      {
        ...metric(
          'returning_customer_rate',
          'Returning customer rate',
          'percent',
          returningRate(buyers),
          previousBuyers ? returningRate(previousBuyers) : null
        ),
        reportKey: 'returning_customer_rate',
        spark: timeChart(context, 'line', [], buyerBuckets, previousBuyerBuckets, (row) => ({
          value: row ? returningRate(row) : 0,
        })).points,
      },
      {
        ...metric(
          'average_order_value',
          'Average order value',
          'money',
          aov(totalSales, orders),
          previousTotalSales === null ? null : aov(previousTotalSales, previousOrders ?? 0)
        ),
        reportKey: 'average_order_value',
        spark: timeChart(context, 'line', [], sales, previousSales, (row) => ({
          value: row ? aov(row.total, row.orders) : 0,
        })).points,
      },
      {
        ...metric('orders', 'Orders', 'number', orders, previousOrders),
        reportKey: 'orders_over_time',
        spark: timeChart(context, 'line', [], sales, previousSales, (row) => ({
          value: row?.orders ?? 0,
        })).points,
      },
    ]

    const deviceSessions = sum(byDevice, (row) => row.sessions)

    return {
      range: info,
      money,
      cards,
      salesBySource: bySource.map((row) => ({
        label: SOURCE_LABELS[row.label ?? ''] ?? humanize(row.label),
        sessions: row.sessions,
        orders: row.orders,
        sales: row.sales,
      })),
      sessionsByDevice: byDevice.map((row) => ({
        label: DEVICE_LABELS[row.label ?? ''] ?? humanize(row.label),
        sessions: row.sessions,
        percent: ratePercent(row.sessions, deviceSessions),
      })),
      topProducts: topProducts.map(({ title, units, sales: productSales }) => ({
        title,
        units,
        sales: productSales,
      })),
      funnel: this.funnelSteps(sessionTotals).map((step) => ({
        label: step.label,
        sessions: step.sessions,
        percent: ratePercent(step.sessions, sessionTotals.sessions),
      })),
      notes: this.trackingNotes(range, trackingStartedAt),
    }
  }

  async report(key: AnalyticsReportKey, input: AnalyticsRangeInput): Promise<AnalyticsReport> {
    const definition = analyticsReport(key)
    const { context, money, info, trackingStartedAt } = await this.prepare(input)
    const section = await this.section(key, context)
    const ignoresRange = 'ignoresRange' in definition && definition.ignoresRange === true

    return {
      key,
      category: definition.category,
      title: definition.title,
      description: definition.description,
      usesSessions: definition.usesSessions,
      ignoresRange,
      range: info,
      money,
      summary: section.summary,
      chart: section.chart,
      columns: section.columns,
      rows: section.rows,
      notes: [
        ...(definition.usesSessions ? this.trackingNotes(context.range, trackingStartedAt) : []),
        ...(ignoresRange ? ['Shows stock right now; the date range does not apply.'] : []),
        ...(section.notes ?? []),
      ],
    }
  }

  async live(): Promise<AnalyticsLive> {
    const settings = await this.storeSettingService.get()
    const now = DateTime.now().setZone(settings.timezone)
    const activeSince = now.minus({ minutes: ANALYTICS_LIVE_WINDOW_MINUTES })
    const minutesSince = now.minus({ minutes: 29 }).startOf('minute')
    const today = now.startOf('day')

    const [counts, orders, pages, minuteRows, recentOrders] = await Promise.all([
      this.analyticsSessionRepository.liveCounts(toDate(activeSince), toDate(today)),
      this.analyticsRepository.orderTotalsSince(toDate(today), settings.currencyCode),
      this.analyticsSessionRepository.livePages(toDate(activeSince), ANALYTICS_TOP_ROWS),
      this.analyticsSessionRepository.liveMinutes(toDate(minutesSince), settings.timezone),
      this.dashboardRepository.recentOrders(ANALYTICS_TOP_ROWS),
    ])

    const views = new Map(minuteRows.map((row) => [row.bucket, row.value]))
    return {
      generatedAt: now.toISO()!,
      money: {
        currencyCode: settings.currencyCode,
        currencyDisplay: settings.currencyDisplay,
        locale: settings.locale,
      },
      windowMinutes: ANALYTICS_LIVE_WINDOW_MINUTES,
      visitorsNow: counts.visitorsNow,
      sessionsToday: counts.sessionsToday,
      ordersToday: orders.orders,
      salesToday: orders.sales,
      activeCarts: counts.activeCarts,
      activeCheckouts: counts.activeCheckouts,
      topPages: pages,
      minutes: Array.from({ length: 30 }, (_, index) => {
        const minute = minutesSince.plus({ minutes: index })
        return { label: minute.toFormat('HH:mm'), views: views.get(bucketKey(minute)) ?? 0 }
      }),
      recentOrders: recentOrders
        .filter((order) => order.completedAt >= toDate(today))
        .map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.total,
          currencyCode: order.currencyCode,
          completedAt: new Date(order.completedAt).toISOString(),
        })),
    }
  }

  protected async prepare(input: AnalyticsRangeInput) {
    const [settings, firstSessionAt] = await Promise.all([
      this.storeSettingService.get(),
      this.analyticsSessionRepository.firstSessionAt(),
    ])
    const range = resolveAnalyticsRange(input, settings.timezone)
    const context: Context = {
      range,
      timezone: settings.timezone,
      currencyCode: settings.currencyCode,
      buckets: bucketStarts(range.from, range.end, range.grain),
      previousBuckets:
        range.previousFrom && range.previousEnd
          ? bucketStarts(range.previousFrom, range.previousEnd, range.grain)
          : null,
    }
    const trackingStartedAt = firstSessionAt
      ? DateTime.fromJSDate(new Date(firstSessionAt)).setZone(settings.timezone)
      : null
    const info: AnalyticsRangeInfo = {
      from: range.from.toISODate()!,
      to: range.end.minus({ days: 1 }).toISODate()!,
      compare: range.compare,
      grain: range.grain,
      previousFrom: range.previousFrom?.toISODate() ?? null,
      previousTo: range.previousEnd?.minus({ days: 1 }).toISODate() ?? null,
      trackingStartedAt: trackingStartedAt?.toISO() ?? null,
    }
    const money: AnalyticsMoney = {
      currencyCode: settings.currencyCode,
      currencyDisplay: settings.currencyDisplay,
      locale: settings.locale,
    }
    return { context, money, info, trackingStartedAt }
  }

  /** Warns when the range (or comparison) starts before session tracking did. */
  protected trackingNotes(range: AnalyticsRange, trackingStartedAt: DateTime | null): string[] {
    if (!trackingStartedAt) {
      return [
        'No storefront sessions have been recorded yet. Sessions and conversion start counting once shoppers visit the online store.',
      ]
    }
    const earliest = range.previousFrom ?? range.from
    if (earliest >= trackingStartedAt.startOf('day')) return []
    return [
      `Session tracking started on ${trackingStartedAt.toFormat('d LLL yyyy')}. Sessions and conversion before that date were not recorded, so comparisons that span it are not a change in shopper behavior.`,
    ]
  }

  protected salesSeries(context: Context, from: Date, end: Date) {
    return this.analyticsRepository.salesSeries(
      from,
      end,
      context.range.grain,
      context.timezone,
      context.currencyCode
    )
  }

  protected buyerSeries(context: Context, from: Date, end: Date) {
    return this.analyticsRepository.buyerSeries(
      from,
      end,
      context.range.grain,
      context.timezone,
      context.currencyCode
    )
  }

  protected async buyerTotals(context: Context, from: Date, end: Date) {
    const [row] = await this.analyticsRepository.buyerSeries(
      from,
      end,
      null,
      context.timezone,
      context.currencyCode
    )
    return (
      row ?? {
        bucket: 'all',
        newCustomers: 0,
        returningCustomers: 0,
        firstOrders: 0,
        repeatOrders: 0,
        firstSales: 0,
        repeatSales: 0,
      }
    )
  }

  /** Runs a query for the current range and, when comparing, the previous one. */
  protected async both<T>(
    context: Context,
    query: (from: Date, end: Date) => Promise<T>
  ): Promise<[T, T | null]> {
    const { range } = context
    return Promise.all([
      query(toDate(range.from), toDate(range.end)),
      range.previousFrom && range.previousEnd
        ? query(toDate(range.previousFrom), toDate(range.previousEnd))
        : Promise.resolve(null),
    ])
  }

  protected funnelSteps(totals: {
    sessions: number
    viewedProduct: number
    addedToCart: number
    reachedCheckout: number
    converted: number
  }) {
    return [
      { key: 'sessions', label: 'Sessions', sessions: totals.sessions },
      { key: 'viewed_product', label: 'Viewed a product', sessions: totals.viewedProduct },
      { key: 'added_to_cart', label: 'Added to cart', sessions: totals.addedToCart },
      { key: 'reached_checkout', label: 'Reached checkout', sessions: totals.reachedCheckout },
      { key: 'ordered', label: 'Ordered', sessions: totals.converted },
    ]
  }

  protected async section(key: AnalyticsReportKey, context: Context): Promise<Section> {
    const from = toDate(context.range.from)
    const end = toDate(context.range.end)
    const { currencyCode, timezone } = context
    const grain = context.range.grain
    const sessions = this.analyticsSessionRepository
    const repo = this.analyticsRepository

    switch (key) {
      case 'sales_over_time':
      case 'finance_summary': {
        const [rows, previous] = await this.both(context, (a, b) => this.salesSeries(context, a, b))
        const totals = (list: SalesBucketRow[]) => ({
          gross: sum(list, (row) => row.gross),
          discounts: sum(list, (row) => row.discounts),
          returns: sum(list, (row) => row.returns),
          net: sum(list, netSales),
          shipping: sum(list, (row) => row.shipping),
          taxes: sum(list, (row) => row.taxes),
          total: sum(list, (row) => row.total),
        })
        const current = totals(rows)
        const before = previous ? totals(previous) : null
        const labels: [keyof typeof current, string][] = [
          ['gross', 'Gross sales'],
          ['discounts', 'Discounts'],
          ['returns', 'Returns'],
          ['net', 'Net sales'],
          ['shipping', 'Shipping charges'],
          ['taxes', 'Taxes'],
          ['total', 'Total sales'],
        ]
        const summary = labels.map(([field, label]) =>
          metric(field, label, 'money', current[field], before ? before[field] : null)
        )
        const chart = timeChart(
          context,
          'line',
          [{ key: 'total', label: 'Total sales', format: 'money' }],
          rows,
          previous,
          (row) => ({ total: row?.total ?? 0 })
        )
        if (key === 'finance_summary') {
          return {
            summary: summary.filter(({ key: field }) => field === 'net' || field === 'total'),
            chart,
            columns: [
              { key: 'metric', label: 'Line', format: 'text' },
              { key: 'value', label: 'Amount', format: 'money' },
              { key: 'previous', label: 'Comparison', format: 'money' },
            ],
            rows: summary.map((item) => ({
              metric: item.label,
              value: item.value,
              previous: item.previous,
            })),
            notes: [
              'Returns are refunds on orders placed in this period. Amounts are in the store currency.',
            ],
          }
        }
        return {
          summary,
          chart,
          columns: [
            PERIOD_COLUMN,
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'gross', label: 'Gross sales', format: 'money' },
            { key: 'discounts', label: 'Discounts', format: 'money' },
            { key: 'returns', label: 'Returns', format: 'money' },
            { key: 'net', label: 'Net sales', format: 'money' },
            { key: 'shipping', label: 'Shipping', format: 'money' },
            { key: 'taxes', label: 'Taxes', format: 'money' },
            { key: 'total', label: 'Total sales', format: 'money' },
          ],
          rows: periodRows(context, rows, (row) => ({
            orders: row?.orders ?? 0,
            gross: row?.gross ?? 0,
            discounts: row?.discounts ?? 0,
            returns: row?.returns ?? 0,
            net: row ? netSales(row) : 0,
            shipping: row?.shipping ?? 0,
            taxes: row?.taxes ?? 0,
            total: row?.total ?? 0,
          })),
        }
      }

      case 'average_order_value':
      case 'orders_over_time': {
        const [rows, previous] = await this.both(context, (a, b) => this.salesSeries(context, a, b))
        const aov = (list: { total: number; orders: number }[]) => {
          const count = sum(list, (row) => row.orders)
          return count > 0 ? sum(list, (row) => row.total) / count : 0
        }
        if (key === 'orders_over_time') {
          return {
            summary: [
              metric(
                'orders',
                'Orders',
                'number',
                sum(rows, (row) => row.orders),
                previous ? sum(previous, (row) => row.orders) : null
              ),
            ],
            chart: timeChart(
              context,
              'bar',
              [{ key: 'orders', label: 'Orders', format: 'number' }],
              rows,
              previous,
              (row) => ({ orders: row?.orders ?? 0 })
            ),
            columns: [PERIOD_COLUMN, { key: 'orders', label: 'Orders', format: 'number' }],
            rows: periodRows(context, rows, (row) => ({ orders: row?.orders ?? 0 })),
          }
        }
        return {
          summary: [
            metric(
              'aov',
              'Average order value',
              'money',
              aov(rows),
              previous ? aov(previous) : null
            ),
          ],
          chart: timeChart(
            context,
            'line',
            [{ key: 'aov', label: 'Average order value', format: 'money' }],
            rows,
            previous,
            (row) => ({ aov: row ? aov([row]) : 0 })
          ),
          columns: [
            PERIOD_COLUMN,
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'total', label: 'Total sales', format: 'money' },
            { key: 'aov', label: 'Average order value', format: 'money' },
          ],
          rows: periodRows(context, rows, (row) => ({
            orders: row?.orders ?? 0,
            total: row?.total ?? 0,
            aov: row ? aov([row]) : 0,
          })),
        }
      }

      case 'sales_by_product': {
        const rows = await repo.productSales(from, end, currencyCode, ANALYTICS_REPORT_ROWS)
        return {
          summary: [
            metric(
              'sales',
              'Net sales',
              'money',
              sum(rows, (row) => row.sales),
              null
            ),
            metric(
              'units',
              'Units sold',
              'number',
              sum(rows, (row) => row.units),
              null
            ),
          ],
          chart: barChart(
            [{ key: 'sales', label: 'Net sales', format: 'money' }],
            rows.map((row) => ({ label: row.title, values: { sales: row.sales } }))
          ),
          columns: [
            { key: 'title', label: 'Product', format: 'text' },
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'units', label: 'Units sold', format: 'number' },
            { key: 'sales', label: 'Net sales', format: 'money' },
          ],
          rows,
        }
      }

      case 'sales_by_variant': {
        const rows = await repo.variantSales(from, end, currencyCode, ANALYTICS_REPORT_ROWS)
        return {
          summary: [],
          chart: barChart(
            [{ key: 'units', label: 'Units sold', format: 'number' }],
            rows.map((row) => ({
              label: row.sku ?? row.title,
              values: { units: row.units },
            }))
          ),
          columns: [
            { key: 'title', label: 'Product', format: 'text' },
            { key: 'variantTitle', label: 'Variant', format: 'text' },
            { key: 'sku', label: 'SKU', format: 'text' },
            { key: 'units', label: 'Units sold', format: 'number' },
            { key: 'sales', label: 'Net sales', format: 'money' },
          ],
          rows,
        }
      }

      case 'sales_by_market': {
        const rows = await repo.marketSales(from, end)
        return {
          summary: [],
          chart: barChart(
            [{ key: 'orders', label: 'Orders', format: 'number' }],
            rows.map((row) => ({
              label: row.name ?? `Other (${row.currencyCode})`,
              values: { orders: row.orders },
            }))
          ),
          columns: [
            { key: 'market', label: 'Market', format: 'text' },
            { key: 'currencyCode', label: 'Currency', format: 'text' },
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'sales', label: 'Total sales', format: 'money', currencyKey: 'currencyCode' },
          ],
          rows: rows.map((row) => ({
            market: row.name ?? `Other (${row.currencyCode})`,
            currencyCode: row.currencyCode,
            orders: row.orders,
            sales: row.sales,
          })),
          notes: [
            'Each market is shown in its own currency; amounts are never added across currencies.',
          ],
        }
      }

      case 'sales_by_discount': {
        const rows = await repo.discountSales(from, end, currencyCode, ANALYTICS_REPORT_ROWS)
        return {
          summary: [
            metric(
              'discounts',
              'Discounts given',
              'money',
              sum(rows, (row) => row.discounts),
              null
            ),
            metric(
              'orders',
              'Discounted orders',
              'number',
              sum(rows, (row) => row.orders),
              null
            ),
          ],
          chart: barChart(
            [{ key: 'discounts', label: 'Discounts', format: 'money' }],
            rows.map((row) => ({ label: row.code, values: { discounts: row.discounts } }))
          ),
          columns: [
            { key: 'code', label: 'Discount', format: 'text' },
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'discounts', label: 'Discount amount', format: 'money' },
            { key: 'sales', label: 'Total sales', format: 'money' },
          ],
          rows,
        }
      }

      case 'sessions_over_time':
      case 'conversion_over_time': {
        const [[rows, previous], [totals, previousTotals]] = await Promise.all([
          this.both(context, (a, b) => sessions.series(a, b, grain, timezone)),
          this.both(context, (a, b) => sessions.totals(a, b)),
        ])
        if (key === 'sessions_over_time') {
          return {
            summary: [
              metric(
                'sessions',
                'Sessions',
                'number',
                totals.sessions,
                previousTotals?.sessions ?? null
              ),
              metric(
                'visitors',
                'Visitors',
                'number',
                totals.visitors,
                previousTotals?.visitors ?? null
              ),
            ],
            chart: timeChart(
              context,
              'line',
              [{ key: 'sessions', label: 'Sessions', format: 'number' }],
              rows,
              previous,
              (row) => ({ sessions: row?.sessions ?? 0 })
            ),
            columns: [
              PERIOD_COLUMN,
              { key: 'sessions', label: 'Sessions', format: 'number' },
              { key: 'converted', label: 'Sessions with an order', format: 'number' },
            ],
            rows: periodRows(context, rows, (row) => ({
              sessions: row?.sessions ?? 0,
              converted: row?.converted ?? 0,
            })),
          }
        }
        return {
          summary: [
            metric(
              'conversion',
              'Conversion rate',
              'percent',
              ratePercent(totals.converted, totals.sessions),
              previousTotals ? ratePercent(previousTotals.converted, previousTotals.sessions) : null
            ),
            metric(
              'sessions',
              'Sessions',
              'number',
              totals.sessions,
              previousTotals?.sessions ?? null
            ),
            metric(
              'converted',
              'Sessions with an order',
              'number',
              totals.converted,
              previousTotals?.converted ?? null
            ),
          ],
          chart: timeChart(
            context,
            'line',
            [{ key: 'conversion', label: 'Conversion rate', format: 'percent' }],
            rows,
            previous,
            (row) => ({ conversion: ratePercent(row?.converted ?? 0, row?.sessions ?? 0) })
          ),
          columns: [
            PERIOD_COLUMN,
            { key: 'sessions', label: 'Sessions', format: 'number' },
            { key: 'converted', label: 'Sessions with an order', format: 'number' },
            { key: 'conversion', label: 'Conversion rate', format: 'percent' },
          ],
          rows: periodRows(context, rows, (row) => ({
            sessions: row?.sessions ?? 0,
            converted: row?.converted ?? 0,
            conversion: ratePercent(row?.converted ?? 0, row?.sessions ?? 0),
          })),
        }
      }

      case 'sessions_by_source':
      case 'sessions_by_referrer':
      case 'sessions_by_landing_page':
      case 'sessions_by_device':
      case 'sessions_by_campaign': {
        const column = (
          {
            sessions_by_source: 'source',
            sessions_by_referrer: 'referrer_host',
            sessions_by_landing_page: 'landing_path',
            sessions_by_device: 'device_type',
            sessions_by_campaign: 'utm_campaign',
          } as const
        )[key]
        const heading = (
          {
            sessions_by_source: 'Source',
            sessions_by_referrer: 'Referrer',
            sessions_by_landing_page: 'Landing page',
            sessions_by_device: 'Device type',
            sessions_by_campaign: 'UTM campaign',
          } as const
        )[key]
        const rows = await sessions.countBy(column, from, end, ANALYTICS_REPORT_ROWS)
        const label = (value: string | null) => {
          if (column === 'source') return SOURCE_LABELS[value ?? ''] ?? humanize(value)
          if (column === 'device_type') return DEVICE_LABELS[value ?? ''] ?? humanize(value)
          if (column === 'referrer_host') return value ?? 'Direct or unknown'
          return value ?? '(none)'
        }
        const total = sum(rows, (row) => row.sessions)
        return {
          summary: [metric('sessions', 'Sessions', 'number', total, null)],
          chart: barChart(
            [{ key: 'sessions', label: 'Sessions', format: 'number' }],
            rows.map((row) => ({ label: label(row.label), values: { sessions: row.sessions } }))
          ),
          columns: [
            { key: 'label', label: heading, format: 'text' },
            { key: 'sessions', label: 'Sessions', format: 'number' },
            { key: 'share', label: 'Share', format: 'percent' },
            { key: 'converted', label: 'Sessions with an order', format: 'number' },
            { key: 'conversion', label: 'Conversion rate', format: 'percent' },
          ],
          rows: rows.map((row) => ({
            label: label(row.label),
            sessions: row.sessions,
            share: ratePercent(row.sessions, total),
            converted: row.converted,
            conversion: ratePercent(row.converted, row.sessions),
          })),
        }
      }

      case 'conversion_funnel': {
        const [totals, previousTotals] = await this.both(context, (a, b) => sessions.totals(a, b))
        const steps = this.funnelSteps(totals)
        const previousSteps = previousTotals ? this.funnelSteps(previousTotals) : null
        return {
          summary: [
            metric(
              'conversion',
              'Conversion rate',
              'percent',
              ratePercent(totals.converted, totals.sessions),
              previousTotals ? ratePercent(previousTotals.converted, previousTotals.sessions) : null
            ),
          ],
          chart: {
            type: 'funnel',
            series: [{ key: 'sessions', label: 'Sessions', format: 'number' }],
            points: steps.map((step, index) => ({
              label: step.label,
              values: { sessions: step.sessions },
              previous: previousSteps ? { sessions: previousSteps[index].sessions } : null,
            })),
          },
          columns: [
            { key: 'step', label: 'Step', format: 'text' },
            { key: 'sessions', label: 'Sessions', format: 'number' },
            { key: 'ofSessions', label: '% of sessions', format: 'percent' },
            { key: 'ofPrevious', label: '% of previous step', format: 'percent' },
          ],
          rows: steps.map((step, index) => ({
            step: step.label,
            sessions: step.sessions,
            ofSessions: ratePercent(step.sessions, totals.sessions),
            ofPrevious: index === 0 ? 100 : ratePercent(step.sessions, steps[index - 1].sessions),
          })),
        }
      }

      case 'product_views_to_cart': {
        const rows = await sessions.productViews(from, end, ANALYTICS_REPORT_ROWS)
        return {
          summary: [
            metric(
              'views',
              'Product views',
              'number',
              sum(rows, (row) => row.views),
              null
            ),
            metric(
              'added',
              'Add to carts',
              'number',
              sum(rows, (row) => row.addedToCart),
              null
            ),
          ],
          chart: barChart(
            [{ key: 'views', label: 'Product views', format: 'number' }],
            rows.map((row) => ({
              label: row.title ?? 'Deleted product',
              values: { views: row.views },
            }))
          ),
          columns: [
            { key: 'title', label: 'Product', format: 'text' },
            { key: 'views', label: 'Views', format: 'number' },
            { key: 'addedToCart', label: 'Add to carts', format: 'number' },
            { key: 'rate', label: 'Add-to-cart rate', format: 'percent' },
          ],
          rows: rows.map((row) => ({
            title: row.title ?? 'Deleted product',
            views: row.views,
            addedToCart: row.addedToCart,
            rate: ratePercent(row.addedToCart, row.views),
          })),
        }
      }

      case 'new_vs_returning_customers':
      case 'returning_customer_rate':
      case 'first_vs_repeat_sales': {
        const [[rows, previous], [totals, previousTotals]] = await Promise.all([
          this.both(context, (a, b) => this.buyerSeries(context, a, b)),
          this.both(context, (a, b) => this.buyerTotals(context, a, b)),
        ])
        const rate = (row: { newCustomers: number; returningCustomers: number } | undefined) =>
          row ? ratePercent(row.returningCustomers, row.newCustomers + row.returningCustomers) : 0

        if (key === 'returning_customer_rate') {
          return {
            summary: [
              metric(
                'rate',
                'Returning customer rate',
                'percent',
                rate(totals),
                previousTotals ? rate(previousTotals) : null
              ),
            ],
            chart: timeChart(
              context,
              'line',
              [{ key: 'rate', label: 'Returning customer rate', format: 'percent' }],
              rows,
              previous,
              (row) => ({ rate: rate(row) })
            ),
            columns: [
              PERIOD_COLUMN,
              { key: 'newCustomers', label: 'New customers', format: 'number' },
              { key: 'returningCustomers', label: 'Returning customers', format: 'number' },
              { key: 'rate', label: 'Returning customer rate', format: 'percent' },
            ],
            rows: periodRows(context, rows, (row) => ({
              newCustomers: row?.newCustomers ?? 0,
              returningCustomers: row?.returningCustomers ?? 0,
              rate: rate(row),
            })),
          }
        }

        if (key === 'first_vs_repeat_sales') {
          return {
            summary: [
              metric(
                'firstSales',
                'First-time sales',
                'money',
                totals.firstSales,
                previousTotals?.firstSales ?? null
              ),
              metric(
                'repeatSales',
                'Repeat sales',
                'money',
                totals.repeatSales,
                previousTotals?.repeatSales ?? null
              ),
            ],
            chart: timeChart(
              context,
              'bar',
              [
                { key: 'firstSales', label: 'First-time', format: 'money' },
                { key: 'repeatSales', label: 'Repeat', format: 'money' },
              ],
              rows,
              null,
              (row) => ({ firstSales: row?.firstSales ?? 0, repeatSales: row?.repeatSales ?? 0 })
            ),
            columns: [
              { key: 'type', label: 'Order type', format: 'text' },
              { key: 'orders', label: 'Orders', format: 'number' },
              { key: 'sales', label: 'Total sales', format: 'money' },
              { key: 'share', label: 'Share of sales', format: 'percent' },
            ],
            rows: [
              {
                type: 'First-time',
                orders: totals.firstOrders,
                sales: totals.firstSales,
                share: ratePercent(totals.firstSales, totals.firstSales + totals.repeatSales),
              },
              {
                type: 'Repeat',
                orders: totals.repeatOrders,
                sales: totals.repeatSales,
                share: ratePercent(totals.repeatSales, totals.firstSales + totals.repeatSales),
              },
            ],
          }
        }

        return {
          summary: [
            metric(
              'newCustomers',
              'New customers',
              'number',
              totals.newCustomers,
              previousTotals?.newCustomers ?? null
            ),
            metric(
              'returningCustomers',
              'Returning customers',
              'number',
              totals.returningCustomers,
              previousTotals?.returningCustomers ?? null
            ),
          ],
          chart: timeChart(
            context,
            'bar',
            [
              { key: 'newCustomers', label: 'New', format: 'number' },
              { key: 'returningCustomers', label: 'Returning', format: 'number' },
            ],
            rows,
            null,
            (row) => ({
              newCustomers: row?.newCustomers ?? 0,
              returningCustomers: row?.returningCustomers ?? 0,
            })
          ),
          columns: [
            PERIOD_COLUMN,
            { key: 'newCustomers', label: 'New customers', format: 'number' },
            { key: 'returningCustomers', label: 'Returning customers', format: 'number' },
          ],
          rows: periodRows(context, rows, (row) => ({
            newCustomers: row?.newCustomers ?? 0,
            returningCustomers: row?.returningCustomers ?? 0,
          })),
          notes: [
            'A customer is new when their first ever order falls in the period. Guest orders are grouped by email.',
          ],
        }
      }

      case 'customers_by_country': {
        const rows = await repo.customersByCountry(from, end, currencyCode, ANALYTICS_REPORT_ROWS)
        const name = (code: string | null) => (code ? countryName(code) : 'Unknown')
        return {
          summary: [],
          chart: barChart(
            [{ key: 'customers', label: 'Customers', format: 'number' }],
            rows.map((row) => ({
              label: name(row.countryCode),
              values: { customers: row.customers },
            }))
          ),
          columns: [
            { key: 'country', label: 'Country', format: 'text' },
            { key: 'customers', label: 'Customers', format: 'number' },
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'sales', label: 'Total sales', format: 'money' },
          ],
          rows: rows.map((row) => ({
            country: name(row.countryCode),
            customers: row.customers,
            orders: row.orders,
            sales: row.sales,
          })),
        }
      }

      case 'marketing_by_utm_source':
      case 'marketing_by_utm_campaign': {
        const column = key === 'marketing_by_utm_source' ? 'utm_source' : 'utm_campaign'
        const rows = await repo.utmPerformance(
          column,
          from,
          end,
          currencyCode,
          ANALYTICS_REPORT_ROWS
        )
        return {
          summary: [
            metric(
              'sessions',
              'Tagged sessions',
              'number',
              sum(rows, (row) => row.sessions),
              null
            ),
            metric(
              'sales',
              'Attributed sales',
              'money',
              sum(rows, (row) => row.sales),
              null
            ),
          ],
          chart: barChart(
            [{ key: 'sessions', label: 'Sessions', format: 'number' }],
            rows.map((row) => ({
              label: row.label ?? '(none)',
              values: { sessions: row.sessions },
            }))
          ),
          columns: [
            {
              key: 'label',
              label: column === 'utm_source' ? 'UTM source' : 'UTM campaign',
              format: 'text',
            },
            { key: 'sessions', label: 'Sessions', format: 'number' },
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'conversion', label: 'Conversion rate', format: 'percent' },
            { key: 'sales', label: 'Total sales', format: 'money' },
          ],
          rows: rows.map((row) => ({
            label: row.label ?? '(none)',
            sessions: row.sessions,
            orders: row.orders,
            conversion: ratePercent(row.orders, row.sessions),
            sales: row.sales,
          })),
          notes: ['Orders are attributed to the session they were placed in.'],
        }
      }

      case 'fulfillment_status': {
        const rows = await repo.ordersByStatus('fulfillment_status', from, end)
        const total = sum(rows, (row) => row.orders)
        return {
          summary: [metric('orders', 'Orders', 'number', total, null)],
          chart: barChart(
            [{ key: 'orders', label: 'Orders', format: 'number' }],
            rows.map((row) => ({ label: humanize(row.status), values: { orders: row.orders } }))
          ),
          columns: [
            { key: 'status', label: 'Fulfillment status', format: 'text' },
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'share', label: 'Share', format: 'percent' },
          ],
          rows: rows.map((row) => ({
            status: humanize(row.status),
            orders: row.orders,
            share: ratePercent(row.orders, total),
          })),
        }
      }

      case 'fulfillment_time': {
        const [rows, previous] = await this.both(context, (a, b) =>
          repo.fulfillmentTimeSeries(a, b, grain, timezone)
        )
        const average = (list: { fulfilled: number; hours: number }[]) => {
          const count = sum(list, (row) => row.fulfilled)
          return count > 0 ? sum(list, (row) => row.hours * row.fulfilled) / count : 0
        }
        return {
          summary: [
            metric(
              'hours',
              'Average time to fulfill',
              'hours',
              average(rows),
              previous ? average(previous) : null
            ),
            metric(
              'fulfilled',
              'Fulfilled orders',
              'number',
              sum(rows, (row) => row.fulfilled),
              null
            ),
          ],
          chart: timeChart(
            context,
            'line',
            [{ key: 'hours', label: 'Hours to fulfill', format: 'hours' }],
            rows,
            previous,
            (row) => ({ hours: row?.hours ?? 0 })
          ),
          columns: [
            PERIOD_COLUMN,
            { key: 'fulfilled', label: 'Fulfilled orders', format: 'number' },
            { key: 'hours', label: 'Average time to fulfill', format: 'hours' },
          ],
          rows: periodRows(context, rows, (row) => ({
            fulfilled: row?.fulfilled ?? 0,
            hours: row?.hours ?? 0,
          })),
          notes: ['Grouped by the date the order was placed.'],
        }
      }

      case 'returns_over_time': {
        const [[rows, previous], reasons] = await Promise.all([
          this.both(context, (a, b) => repo.returnsSeries(a, b, grain, timezone)),
          repo.returnReasons(from, end),
        ])
        return {
          summary: [
            metric(
              'returns',
              'Returns',
              'number',
              sum(rows, (row) => row.returns),
              previous ? sum(previous, (row) => row.returns) : null
            ),
            metric(
              'items',
              'Items returned',
              'number',
              sum(rows, (row) => row.items),
              previous ? sum(previous, (row) => row.items) : null
            ),
          ],
          chart: timeChart(
            context,
            'bar',
            [{ key: 'returns', label: 'Returns', format: 'number' }],
            rows,
            previous,
            (row) => ({ returns: row?.returns ?? 0 })
          ),
          columns: [
            { key: 'reason', label: 'Reason', format: 'text' },
            { key: 'returns', label: 'Returns', format: 'number' },
            { key: 'items', label: 'Items', format: 'number' },
          ],
          rows: reasons.map((row) => ({
            reason: humanize(row.reason),
            returns: row.returns,
            items: row.items,
          })),
        }
      }

      case 'refunds_over_time': {
        const [rows, previous] = await this.both(context, (a, b) =>
          repo.refundsSeries(a, b, grain, timezone, currencyCode)
        )
        return {
          summary: [
            metric(
              'amount',
              'Refunded',
              'money',
              sum(rows, (row) => row.amount),
              previous ? sum(previous, (row) => row.amount) : null
            ),
            metric(
              'refunds',
              'Refunds',
              'number',
              sum(rows, (row) => row.refunds),
              previous ? sum(previous, (row) => row.refunds) : null
            ),
          ],
          chart: timeChart(
            context,
            'bar',
            [{ key: 'amount', label: 'Refunded', format: 'money' }],
            rows,
            previous,
            (row) => ({ amount: row?.amount ?? 0 })
          ),
          columns: [
            PERIOD_COLUMN,
            { key: 'refunds', label: 'Refunds', format: 'number' },
            { key: 'amount', label: 'Refunded', format: 'money' },
          ],
          rows: periodRows(context, rows, (row) => ({
            refunds: row?.refunds ?? 0,
            amount: row?.amount ?? 0,
          })),
          notes: ['Successful refunds, by the date they were issued.'],
        }
      }

      case 'stock_on_hand': {
        const rows = await repo.stockOnHand(ANALYTICS_REPORT_ROWS)
        return {
          summary: [],
          chart: null,
          columns: [
            { key: 'title', label: 'Product', format: 'text' },
            { key: 'variantTitle', label: 'Variant', format: 'text' },
            { key: 'sku', label: 'SKU', format: 'text' },
            { key: 'location', label: 'Location', format: 'text' },
            { key: 'available', label: 'Available', format: 'number' },
            { key: 'committed', label: 'Committed', format: 'number' },
            { key: 'incoming', label: 'Incoming', format: 'number' },
          ],
          rows,
          notes:
            rows.length >= ANALYTICS_REPORT_ROWS
              ? [`Showing the first ${ANALYTICS_REPORT_ROWS} rows.`]
              : [],
        }
      }

      case 'low_stock': {
        const rows = await repo.lowStock(LOW_STOCK_THRESHOLD, ANALYTICS_REPORT_ROWS)
        return {
          summary: [metric('variants', 'Low-stock variants', 'number', rows.length, null)],
          chart: null,
          columns: [
            { key: 'title', label: 'Product', format: 'text' },
            { key: 'variantTitle', label: 'Variant', format: 'text' },
            { key: 'sku', label: 'SKU', format: 'text' },
            { key: 'available', label: 'Available', format: 'number' },
          ],
          rows,
          notes: [
            `Tracked variants with ${LOW_STOCK_THRESHOLD} or fewer units across all locations.`,
          ],
        }
      }

      case 'days_of_stock': {
        const soldSince = DateTime.now().minus({ days: 30 }).toJSDate()
        const rows = await repo.stockAndSales(soldSince, ANALYTICS_REPORT_ROWS)
        return {
          summary: [],
          chart: null,
          columns: [
            { key: 'title', label: 'Product', format: 'text' },
            { key: 'variantTitle', label: 'Variant', format: 'text' },
            { key: 'sku', label: 'SKU', format: 'text' },
            { key: 'available', label: 'Available', format: 'number' },
            { key: 'soldRecently', label: 'Sold (30 days)', format: 'number' },
            { key: 'daysLeft', label: 'Days of stock left', format: 'number' },
          ],
          rows: rows.map((row) => ({
            ...row,
            daysLeft: Math.round((Math.max(row.available, 0) / (row.soldRecently / 30)) * 10) / 10,
          })),
          notes: ['Only variants that sold in the last 30 days. Lowest days of stock first.'],
        }
      }

      case 'payments': {
        const rows = await repo.payments(from, end, currencyCode)
        return {
          summary: [],
          chart: barChart(
            [{ key: 'orders', label: 'Orders', format: 'number' }],
            rows.map((row) => ({
              label: `${PAYMENT_METHOD_LABELS[row.method ?? ''] ?? humanize(row.method, 'Manual')} · ${humanize(row.status, 'No status')}`,
              values: { orders: row.orders },
            }))
          ),
          columns: [
            { key: 'method', label: 'Payment method', format: 'text' },
            { key: 'status', label: 'Payment status', format: 'text' },
            { key: 'orders', label: 'Orders', format: 'number' },
            { key: 'amount', label: 'Order total', format: 'money' },
          ],
          rows: rows.map((row) => ({
            method: PAYMENT_METHOD_LABELS[row.method ?? ''] ?? humanize(row.method, 'Manual'),
            status: humanize(row.status, 'No status'),
            orders: row.orders,
            amount: row.amount,
          })),
          notes: ['Orders without a payment method were created by staff.'],
        }
      }
    }
  }
}
