import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { countryName } from '#constants/countries'
import {
  DASHBOARD_MARKET_SLOTS,
  DASHBOARD_MONTHS,
  DASHBOARD_RANGE_DAYS,
  DASHBOARD_RECENT_ORDERS,
  DASHBOARD_REGION_SLOTS,
  LOW_STOCK_THRESHOLD,
  NEW_REVIEWS_DAYS,
  type DashboardRange,
} from '#constants/dashboard'
import DashboardRepository, {
  type ActiveMarketRow,
  type MarketSalesRow,
  type PeriodTotals,
  type RecentOrderRow,
  type TodoCounts,
} from '#repositories/dashboard_repository'
import StoreSettingService from '#services/store_setting_service'

export type DashboardTrend = 'up' | 'down' | 'flat'

/** `percent` is null when the previous value was 0 and the current one isn't ("New"). */
export type DashboardChange = { percent: number | null; trend: DashboardTrend }

export type DashboardPeriod = {
  revenue: number
  orders: number
  newCustomers: number
  averageOrderValue: number
}

export type DashboardMonthBar = { month: string; label: string; revenue: number }

/** Amounts are in the market's own `currencyCode`; never add them across markets. */
export type DashboardMarket = {
  marketId: string | null
  name: string
  currencyCode: string
  isPrimary: boolean
  revenue: number
  orders: number
  averageOrderValue: number
  change: DashboardChange
}

export type DashboardOverview = {
  range: DashboardRange
  days: number
  money: { currencyCode: string; currencyDisplay: string; locale: string }
  current: DashboardPeriod
  previous: DashboardPeriod
  changes: Record<keyof DashboardPeriod, DashboardChange>
  markets: DashboardMarket[]
  regions: { name: string; revenue: number; percent: number }[]
  gauges: { newCustomersPercent: number; repeatPercent: number; unpaidPercent: number }
  month: {
    label: string
    previousLabel: string
    revenue: number
    previousRevenue: number
    salesGrowth: DashboardChange
    previousRevenueChange: DashboardChange
    averageOrderValue: number
    averageOrderValueChange: DashboardChange
    discounts: number
    discountsChange: DashboardChange
  }
  monthly: DashboardMonthBar[]
  todo: TodoCounts
  recentOrders: RecentOrderRow[]
}

/** Changes under 1% either way read as flat. */
export function compareChange(current: number, previous: number): DashboardChange {
  if (previous === 0) {
    return current === 0 ? { percent: 0, trend: 'flat' } : { percent: null, trend: 'up' }
  }
  const percent = Math.round(((current - previous) / Math.abs(previous)) * 100)
  if (Math.abs(percent) < 1) return { percent: 0, trend: 'flat' }
  return { percent, trend: percent > 0 ? 'up' : 'down' }
}

export function sharePercent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)))
}

const averageOf = (total: number, count: number) => (count > 0 ? total / count : 0)

/**
 * Month buckets from `start` for `count` months, keyed `yyyy-MM` to match the
 * repository, with zero for months that had no orders.
 */
export function padMonths(
  start: DateTime,
  count: number,
  rows: { month: string; revenue: number; orders: number; discounts: number }[]
) {
  const byMonth = new Map(rows.map((row) => [row.month, row]))
  return Array.from({ length: count }, (_, index) => {
    const date = start.plus({ months: index })
    const key = date.toFormat('yyyy-MM')
    const row = byMonth.get(key)
    return {
      month: key,
      label: date.toFormat('LLL'),
      longLabel: date.toFormat('LLLL yyyy'),
      revenue: row?.revenue ?? 0,
      orders: row?.orders ?? 0,
      discounts: row?.discounts ?? 0,
    }
  })
}

/**
 * One row per market and currency, padded with active markets that had no
 * sales. Primary market first, then markets by revenue; orders whose market
 * was deleted go last as "Other (CUR)".
 */
export function buildMarketSales(
  rows: MarketSalesRow[],
  activeMarkets: ActiveMarketRow[],
  limit: number
): DashboardMarket[] {
  const markets: DashboardMarket[] = rows.map((row) => ({
    marketId: row.marketId,
    name: row.name ?? `Other (${row.currencyCode})`,
    currencyCode: row.currencyCode,
    isPrimary: row.isPrimary,
    revenue: row.revenue,
    orders: row.orders,
    averageOrderValue: averageOf(row.revenue, row.orders),
    change: compareChange(row.revenue, row.previousRevenue),
  }))

  for (const market of activeMarkets) {
    if (markets.some((row) => row.marketId === market.id)) continue
    markets.push({
      marketId: market.id,
      name: market.name,
      currencyCode: market.currencyCode,
      isPrimary: market.isPrimary,
      revenue: 0,
      orders: 0,
      averageOrderValue: 0,
      change: compareChange(0, 0),
    })
  }

  const rank = (row: DashboardMarket) => (row.isPrimary ? 0 : row.marketId ? 1 : 2)
  return markets
    .sort((a, b) => rank(a) - rank(b) || b.revenue - a.revenue || a.name.localeCompare(b.name))
    .slice(0, limit)
}

@inject()
export default class DashboardService {
  constructor(
    protected dashboardRepository: DashboardRepository,
    protected storeSettingService: StoreSettingService
  ) {}

  async overview(range: DashboardRange): Promise<DashboardOverview> {
    const settings = await this.storeSettingService.get()
    const currencyCode = settings.currencyCode
    const days = DASHBOARD_RANGE_DAYS[range]

    const now = DateTime.now().setZone(settings.timezone).setLocale(settings.locale)
    const from = now.startOf('day').minus({ days: days - 1 })
    const previousFrom = from.minus({ days })
    const firstMonth = now.startOf('month').minus({ months: DASHBOARD_MONTHS - 1 })

    const [
      currentTotals,
      previousTotals,
      currentBuyers,
      previousBuyers,
      regionRows,
      monthRows,
      todo,
      recentOrders,
      marketCountries,
      marketRows,
      activeMarkets,
    ] = await Promise.all([
      this.dashboardRepository.periodTotals(from.toJSDate(), now.toJSDate(), currencyCode),
      this.dashboardRepository.periodTotals(previousFrom.toJSDate(), from.toJSDate(), currencyCode),
      this.dashboardRepository.buyerMix(from.toJSDate(), now.toJSDate()),
      this.dashboardRepository.buyerMix(previousFrom.toJSDate(), from.toJSDate()),
      this.dashboardRepository.topRegions(
        from.toJSDate(),
        now.toJSDate(),
        currencyCode,
        DASHBOARD_REGION_SLOTS
      ),
      this.dashboardRepository.monthlySales(firstMonth.toJSDate(), currencyCode, settings.timezone),
      this.dashboardRepository.todoCounts(
        LOW_STOCK_THRESHOLD,
        now.minus({ days: NEW_REVIEWS_DAYS }).toJSDate()
      ),
      this.dashboardRepository.recentOrders(DASHBOARD_RECENT_ORDERS),
      this.dashboardRepository.marketCountryCodes(DASHBOARD_REGION_SLOTS * 2),
      this.dashboardRepository.marketSales(
        previousFrom.toJSDate(),
        from.toJSDate(),
        now.toJSDate()
      ),
      this.dashboardRepository.activeMarkets(DASHBOARD_MARKET_SLOTS),
    ])

    const current = this.period(currentTotals, currentBuyers.firstTime)
    const previous = this.period(previousTotals, previousBuyers.firstTime)

    const regions = regionRows.map((row) => ({
      name: row.province ?? (row.countryCode ? countryName(row.countryCode) : 'Unknown'),
      revenue: row.revenue,
      percent: sharePercent(row.revenue, current.revenue),
    }))
    for (const code of marketCountries) {
      if (regions.length >= DASHBOARD_REGION_SLOTS) break
      const name = countryName(code)
      if (!regions.some((region) => region.name === name)) {
        regions.push({ name, revenue: 0, percent: 0 })
      }
    }

    const months = padMonths(firstMonth, DASHBOARD_MONTHS, monthRows)
    const [twoBack, lastMonth, thisMonth] = months.slice(-3)

    return {
      range,
      days,
      money: {
        currencyCode,
        currencyDisplay: settings.currencyDisplay,
        locale: settings.locale,
      },
      current,
      previous,
      changes: {
        revenue: compareChange(current.revenue, previous.revenue),
        orders: compareChange(current.orders, previous.orders),
        newCustomers: compareChange(current.newCustomers, previous.newCustomers),
        averageOrderValue: compareChange(current.averageOrderValue, previous.averageOrderValue),
      },
      markets: buildMarketSales(marketRows, activeMarkets, DASHBOARD_MARKET_SLOTS),
      regions,
      gauges: {
        newCustomersPercent: sharePercent(currentBuyers.firstTime, currentBuyers.buyers),
        repeatPercent: sharePercent(
          currentBuyers.buyers - currentBuyers.firstTime,
          currentBuyers.buyers
        ),
        unpaidPercent: sharePercent(currentTotals.unpaid, currentTotals.orders),
      },
      month: {
        label: thisMonth.longLabel,
        previousLabel: lastMonth.label,
        revenue: thisMonth.revenue,
        previousRevenue: lastMonth.revenue,
        salesGrowth: compareChange(thisMonth.revenue, lastMonth.revenue),
        previousRevenueChange: compareChange(lastMonth.revenue, twoBack.revenue),
        averageOrderValue: averageOf(thisMonth.revenue, thisMonth.orders),
        averageOrderValueChange: compareChange(
          averageOf(thisMonth.revenue, thisMonth.orders),
          averageOf(lastMonth.revenue, lastMonth.orders)
        ),
        discounts: thisMonth.discounts,
        discountsChange: compareChange(thisMonth.discounts, lastMonth.discounts),
      },
      monthly: months.map(({ month, label, revenue }) => ({ month, label, revenue })),
      todo,
      recentOrders,
    }
  }

  protected period(totals: PeriodTotals, newCustomers: number): DashboardPeriod {
    return {
      revenue: totals.revenue,
      orders: totals.storeOrders,
      newCustomers,
      averageOrderValue: averageOf(totals.revenue, totals.storeOrders),
    }
  }
}
