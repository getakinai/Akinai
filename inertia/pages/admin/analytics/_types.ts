import { z } from 'zod'
import { CURRENCY_DISPLAYS } from '~/lib/store_settings'

export const ANALYTICS_COMPARES = ['previous_period', 'previous_year', 'none'] as const

export const AnalyticsCompareSchema = z.enum(ANALYTICS_COMPARES)

export type AnalyticsCompare = z.infer<typeof AnalyticsCompareSchema>

export const ANALYTICS_EXPORT_FORMATS = ['csv', 'pdf'] as const

export type AnalyticsExportFormat = (typeof ANALYTICS_EXPORT_FORMATS)[number]

export const ANALYTICS_PRESETS = [
  'today',
  'last_7',
  'last_30',
  'last_90',
  'last_365',
  'custom',
] as const

export const AnalyticsPresetSchema = z.enum(ANALYTICS_PRESETS)

export type AnalyticsPreset = z.infer<typeof AnalyticsPresetSchema>

export type AnalyticsQuery = {
  from: string | null
  to: string | null
  compare: AnalyticsCompare
}

export const MetricFormatSchema = z.enum(['money', 'number', 'percent', 'hours', 'text'])

export type MetricFormat = z.infer<typeof MetricFormatSchema>

export const AnalyticsMoneySchema = z.object({
  currencyCode: z.string(),
  currencyDisplay: z.enum(CURRENCY_DISPLAYS),
  locale: z.string(),
})

export const AnalyticsRangeSchema = z.object({
  from: z.string(),
  to: z.string(),
  compare: AnalyticsCompareSchema,
  grain: z.enum(['hour', 'day', 'week', 'month']),
  previousFrom: z.string().nullable(),
  previousTo: z.string().nullable(),
  trackingStartedAt: z.string().nullable(),
})

export type AnalyticsRange = z.infer<typeof AnalyticsRangeSchema>

export const AnalyticsChangeSchema = z.object({
  percent: z.number().nullable(),
  trend: z.enum(['up', 'down', 'flat']),
})

export type AnalyticsChange = z.infer<typeof AnalyticsChangeSchema>

export const AnalyticsMetricSchema = z.object({
  key: z.string(),
  label: z.string(),
  format: MetricFormatSchema,
  value: z.number(),
  previous: z.number().nullable(),
  change: AnalyticsChangeSchema.nullable(),
})

export type AnalyticsMetric = z.infer<typeof AnalyticsMetricSchema>

export const AnalyticsPointSchema = z.object({
  label: z.string(),
  values: z.record(z.string(), z.number()),
  previous: z.record(z.string(), z.number()).nullable(),
})

export type AnalyticsPoint = z.infer<typeof AnalyticsPointSchema>

export const AnalyticsSeriesSchema = z.object({
  key: z.string(),
  label: z.string(),
  format: MetricFormatSchema,
})

export const AnalyticsChartSchema = z.object({
  type: z.enum(['line', 'bar', 'funnel']),
  series: z.array(AnalyticsSeriesSchema),
  points: z.array(AnalyticsPointSchema),
})

export type AnalyticsChart = z.infer<typeof AnalyticsChartSchema>

export const AnalyticsColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  format: MetricFormatSchema,
  currencyKey: z.string().optional(),
})

export type AnalyticsColumn = z.infer<typeof AnalyticsColumnSchema>

export const AnalyticsRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]))

export type AnalyticsRow = z.infer<typeof AnalyticsRowSchema>

export const AnalyticsDashboardCardSchema = AnalyticsMetricSchema.extend({
  reportKey: z.string(),
  spark: z.array(AnalyticsPointSchema),
})

export type AnalyticsDashboardCard = z.infer<typeof AnalyticsDashboardCardSchema>

export const AnalyticsDashboardSchema = z.object({
  range: AnalyticsRangeSchema,
  money: AnalyticsMoneySchema,
  cards: z.array(AnalyticsDashboardCardSchema),
  salesBySource: z.array(
    z.object({ label: z.string(), sessions: z.number(), orders: z.number(), sales: z.number() })
  ),
  sessionsByDevice: z.array(
    z.object({ label: z.string(), sessions: z.number(), percent: z.number() })
  ),
  topProducts: z.array(z.object({ title: z.string(), units: z.number(), sales: z.number() })),
  funnel: z.array(z.object({ label: z.string(), sessions: z.number(), percent: z.number() })),
  notes: z.array(z.string()),
})

export type AnalyticsDashboard = z.infer<typeof AnalyticsDashboardSchema>

export const AnalyticsDashboardResponseSchema = z.object({ data: AnalyticsDashboardSchema })

export const AnalyticsReportSchema = z.object({
  key: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  usesSessions: z.boolean(),
  ignoresRange: z.boolean(),
  range: AnalyticsRangeSchema,
  money: AnalyticsMoneySchema,
  summary: z.array(AnalyticsMetricSchema),
  chart: AnalyticsChartSchema.nullable(),
  columns: z.array(AnalyticsColumnSchema),
  rows: z.array(AnalyticsRowSchema),
  notes: z.array(z.string()),
})

export type AnalyticsReport = z.infer<typeof AnalyticsReportSchema>

export const AnalyticsReportResponseSchema = z.object({ data: AnalyticsReportSchema })

export const AnalyticsCatalogSchema = z.object({
  categories: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      available: z.boolean(),
      reports: z.array(
        z.object({
          key: z.string(),
          title: z.string(),
          description: z.string(),
          createdBy: z.string(),
        })
      ),
    })
  ),
})

export type AnalyticsCatalog = z.infer<typeof AnalyticsCatalogSchema>

export const AnalyticsCatalogResponseSchema = z.object({ data: AnalyticsCatalogSchema })

export const RecentReportsSchema = z
  .array(z.object({ key: z.string().max(100), viewedAt: z.string() }))
  .max(20)

export type RecentReport = z.infer<typeof RecentReportsSchema>[number]

export const AnalyticsLiveSchema = z.object({
  generatedAt: z.string(),
  money: AnalyticsMoneySchema,
  windowMinutes: z.number(),
  visitorsNow: z.number(),
  sessionsToday: z.number(),
  ordersToday: z.number(),
  salesToday: z.number(),
  activeCarts: z.number(),
  activeCheckouts: z.number(),
  topPages: z.array(z.object({ path: z.string(), views: z.number() })),
  minutes: z.array(z.object({ label: z.string(), views: z.number() })),
  recentOrders: z.array(
    z.object({
      id: z.string(),
      orderNumber: z.number().nullable(),
      customerName: z.string().nullable(),
      total: z.number(),
      currencyCode: z.string(),
      completedAt: z.string(),
    })
  ),
})

export type AnalyticsLive = z.infer<typeof AnalyticsLiveSchema>

export const AnalyticsLiveResponseSchema = z.object({ data: AnalyticsLiveSchema })
