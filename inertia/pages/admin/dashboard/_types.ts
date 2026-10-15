import { z } from 'zod'
import { CURRENCY_DISPLAYS } from '~/lib/store_settings'

export const ToneSchema = z.enum(['ok', 'danger', 'purple', 'accent', 'info', 'warning'])

export type Tone = z.infer<typeof ToneSchema>

export const TrendSchema = z.enum(['up', 'down', 'flat'])

export type Trend = z.infer<typeof TrendSchema>

export const KpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.enum(['revenue', 'orders', 'customers', 'aov']),
  tone: ToneSchema,
  value: z.string(),
  unit: z.string().optional(),
  trend: TrendSchema,
  change: z.string(),
  compareLabel: z.string(),
  compareValue: z.string(),
  comparePeriod: z.string(),
})

export type Kpi = z.infer<typeof KpiSchema>

export const RegionSalesSchema = z.object({
  name: z.string(),
  value: z.string(),
  percent: z.number().min(0).max(100),
  tone: ToneSchema,
})

export type RegionSales = z.infer<typeof RegionSalesSchema>

export const MarketSalesSchema = z.object({
  key: z.string(),
  name: z.string(),
  currencyCode: z.string(),
  isPrimary: z.boolean(),
  value: z.string(),
  details: z.string(),
  trend: TrendSchema,
  change: z.string(),
  tone: ToneSchema,
})

export type MarketSales = z.infer<typeof MarketSalesSchema>

export const GaugeSchema = z.object({
  label: z.string(),
  caption: z.string(),
  percent: z.number().min(0).max(100),
  tone: ToneSchema,
})

export type Gauge = z.infer<typeof GaugeSchema>

export const MonthlyStatSchema = z.object({
  label: z.string(),
  value: z.string(),
  trend: TrendSchema,
  change: z.string(),
})

export type MonthlyStat = z.infer<typeof MonthlyStatSchema>

export const MonthlyBarSchema = z.object({
  month: z.string(),
  value: z.number().min(0),
})

export type MonthlyBar = z.infer<typeof MonthlyBarSchema>

export const OrderStatusSchema = z.enum(['paid', 'pending', 'shipped', 'refunded'])

export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const RecentOrderSchema = z.object({
  id: z.string(),
  label: z.string(),
  customer: z.string(),
  total: z.string(),
  status: OrderStatusSchema,
  placedAt: z.string(),
})

export type RecentOrder = z.infer<typeof RecentOrderSchema>

export const ThingToDoSchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number().int().min(0),
  route: z.enum(['admin.orders.home', 'admin.products.home', 'admin.returns.home']),
  qs: z.record(z.string(), z.string()).optional(),
})

export type ThingToDo = z.infer<typeof ThingToDoSchema>

export const DASHBOARD_RANGES = ['7d', '30d', '90d'] as const

export const DashboardRangeSchema = z.enum(DASHBOARD_RANGES)

export type DashboardRange = z.infer<typeof DashboardRangeSchema>

const ChangeSchema = z.object({
  percent: z.number().nullable(),
  trend: TrendSchema,
})

export type DashboardChange = z.infer<typeof ChangeSchema>

const PeriodSchema = z.object({
  revenue: z.number(),
  orders: z.number().int(),
  newCustomers: z.number().int(),
  averageOrderValue: z.number(),
})

export const DashboardOverviewSchema = z.object({
  range: DashboardRangeSchema,
  days: z.number().int(),
  money: z.object({
    currencyCode: z.string(),
    currencyDisplay: z.enum(CURRENCY_DISPLAYS).catch('symbol'),
    locale: z.string(),
  }),
  current: PeriodSchema,
  previous: PeriodSchema,
  changes: z.object({
    revenue: ChangeSchema,
    orders: ChangeSchema,
    newCustomers: ChangeSchema,
    averageOrderValue: ChangeSchema,
  }),
  markets: z.array(
    z.object({
      marketId: z.string().nullable(),
      name: z.string(),
      currencyCode: z.string(),
      isPrimary: z.boolean(),
      revenue: z.number(),
      orders: z.number().int().min(0),
      averageOrderValue: z.number(),
      change: ChangeSchema,
    })
  ),
  regions: z.array(
    z.object({ name: z.string(), revenue: z.number(), percent: z.number().min(0).max(100) })
  ),
  gauges: z.object({
    newCustomersPercent: z.number().min(0).max(100),
    repeatPercent: z.number().min(0).max(100),
    unpaidPercent: z.number().min(0).max(100),
  }),
  month: z.object({
    label: z.string(),
    previousLabel: z.string(),
    revenue: z.number(),
    previousRevenue: z.number(),
    salesGrowth: ChangeSchema,
    previousRevenueChange: ChangeSchema,
    averageOrderValue: z.number(),
    averageOrderValueChange: ChangeSchema,
    discounts: z.number(),
    discountsChange: ChangeSchema,
  }),
  monthly: z.array(z.object({ month: z.string(), label: z.string(), revenue: z.number() })),
  todo: z.object({
    toFulfill: z.number().int(),
    awaitingPayment: z.number().int(),
    paymentsToReview: z.number().int(),
    lowStock: z.number().int(),
    newReviews: z.number().int(),
    returnsToReview: z.number().int(),
  }),
  recentOrders: z.array(
    z.object({
      id: z.string(),
      orderNumber: z.number().int().nullable(),
      customerName: z.string().nullable(),
      email: z.string().nullable(),
      total: z.number(),
      currencyCode: z.string(),
      paymentStatus: z.string().nullable(),
      fulfillmentStatus: z.string(),
      completedAt: z.string(),
    })
  ),
})

export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>

export const DashboardOverviewResponseSchema = z.object({ data: DashboardOverviewSchema })
