export const ANALYTICS_EVENT_TYPES = [
  'page_view',
  'product_view',
  'add_to_cart',
  'checkout_started',
  'order_placed',
] as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

/** Event types the storefront may send; `order_placed` is only recorded by checkout. */
export const CLIENT_ANALYTICS_EVENT_TYPES = [
  'page_view',
  'product_view',
  'add_to_cart',
  'checkout_started',
] as const satisfies readonly AnalyticsEventType[]

export const ANALYTICS_SOURCES = [
  'direct',
  'search',
  'social',
  'email',
  'referral',
  'paid',
] as const

export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number]

export const ANALYTICS_DEVICE_TYPES = ['desktop', 'mobile', 'tablet'] as const

export type AnalyticsDeviceType = (typeof ANALYTICS_DEVICE_TYPES)[number]

export const ANALYTICS_VISITOR_COOKIE = 'hp_vid'
export const ANALYTICS_SESSION_COOKIE = 'hp_sid'

/** A visit ends after this long without activity; the next event starts a new session. */
export const ANALYTICS_SESSION_TIMEOUT_MINUTES = 30
export const ANALYTICS_VISITOR_COOKIE_DAYS = 395

/** Raw events older than this are deleted by `node ace analytics:prune`. */
export const ANALYTICS_EVENT_RETENTION_MONTHS = 13

/** Sessions seen within this window count as "visitors right now" in Live View. */
export const ANALYTICS_LIVE_WINDOW_MINUTES = 5

export const ANALYTICS_COMPARES = ['previous_period', 'previous_year', 'none'] as const

export type AnalyticsCompare = (typeof ANALYTICS_COMPARES)[number]

export const ANALYTICS_EXPORT_FORMATS = ['csv', 'pdf'] as const

export type AnalyticsExportFormat = (typeof ANALYTICS_EXPORT_FORMATS)[number]

/** Longest range a dashboard or report query may cover. */
export const ANALYTICS_MAX_RANGE_DAYS = 731

export const ANALYTICS_DEFAULT_RANGE_DAYS = 30

export const ANALYTICS_TOP_ROWS = 10

export const ANALYTICS_REPORT_ROWS = 100

export const ANALYTICS_GRAINS = ['hour', 'day', 'week', 'month'] as const

export type AnalyticsGrain = (typeof ANALYTICS_GRAINS)[number]
