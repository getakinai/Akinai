export const DASHBOARD_RANGES = ['7d', '30d', '90d'] as const

export type DashboardRange = (typeof DASHBOARD_RANGES)[number]

export const DASHBOARD_RANGE_DAYS: Record<DashboardRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export const DEFAULT_DASHBOARD_RANGE: DashboardRange = '7d'

/** Tracked variants with this many units or fewer (all locations) count as low stock. */
export const LOW_STOCK_THRESHOLD = 5

export const DASHBOARD_MONTHS = 6

export const DASHBOARD_REGION_SLOTS = 4

export const DASHBOARD_MARKET_SLOTS = 12

export const DASHBOARD_RECENT_ORDERS = 5

export const NEW_REVIEWS_DAYS = 7
