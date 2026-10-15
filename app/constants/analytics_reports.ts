export const ANALYTICS_REPORT_CATEGORIES = [
  { key: 'sales', label: 'Sales', available: true },
  { key: 'traffic', label: 'Traffic and acquisition', available: true },
  { key: 'behavior', label: 'Shopping behavior', available: true },
  { key: 'customers', label: 'Customers', available: true },
  { key: 'marketing', label: 'Marketing', available: true },
  { key: 'orders', label: 'Orders and fulfillment', available: true },
  { key: 'inventory', label: 'Inventory', available: true },
  { key: 'finance', label: 'Finance', available: true },
  { key: 'profit', label: 'Profit', available: false },
  { key: 'retail', label: 'Retail (POS)', available: false },
  { key: 'fraud', label: 'Fraud', available: false },
] as const

export type AnalyticsReportCategory = (typeof ANALYTICS_REPORT_CATEGORIES)[number]['key']

type ReportDefinition = {
  key: string
  category: AnalyticsReportCategory
  title: string
  description: string
  /** Built from storefront sessions, which only exist since tracking started. */
  usesSessions: boolean
  /** A stock snapshot: the date range does not apply. */
  ignoresRange?: boolean
}

/** Prebuilt reports. Keys are part of the URL (`/admin/analytics/reports/:key`). */
export const ANALYTICS_REPORTS = [
  {
    key: 'sales_over_time',
    category: 'sales',
    title: 'Total sales over time',
    description: 'Gross sales, discounts, returns, net sales, shipping, taxes and total sales.',
    usesSessions: false,
  },
  {
    key: 'sales_by_product',
    category: 'sales',
    title: 'Sales by product',
    description: 'Units sold and net sales for each product.',
    usesSessions: false,
  },
  {
    key: 'sales_by_variant',
    category: 'sales',
    title: 'Sales by product variant SKU',
    description: 'Units sold and net sales for each variant and SKU.',
    usesSessions: false,
  },
  {
    key: 'sales_by_market',
    category: 'sales',
    title: 'Sales by market',
    description: 'Orders and sales for each market, in its own currency.',
    usesSessions: false,
  },
  {
    key: 'sales_by_discount',
    category: 'sales',
    title: 'Sales by discount',
    description: 'Orders, discount amounts and sales for each discount code.',
    usesSessions: false,
  },
  {
    key: 'average_order_value',
    category: 'sales',
    title: 'Average order value over time',
    description: 'Total sales divided by the number of orders.',
    usesSessions: false,
  },
  {
    key: 'sessions_over_time',
    category: 'traffic',
    title: 'Sessions over time',
    description: 'Visits to the online store and unique visitors.',
    usesSessions: true,
  },
  {
    key: 'sessions_by_source',
    category: 'traffic',
    title: 'Sessions by traffic source',
    description: 'Direct, search, social, email, referral and paid visits.',
    usesSessions: true,
  },
  {
    key: 'sessions_by_referrer',
    category: 'traffic',
    title: 'Sessions by referrer',
    description: 'Websites that sent visitors to the store.',
    usesSessions: true,
  },
  {
    key: 'sessions_by_landing_page',
    category: 'traffic',
    title: 'Sessions by landing page',
    description: 'The first page visitors saw.',
    usesSessions: true,
  },
  {
    key: 'sessions_by_device',
    category: 'traffic',
    title: 'Sessions by device type',
    description: 'Desktop, mobile and tablet visits.',
    usesSessions: true,
  },
  {
    key: 'sessions_by_campaign',
    category: 'traffic',
    title: 'Sessions by UTM campaign',
    description: 'Visits tagged with a utm_campaign.',
    usesSessions: true,
  },
  {
    key: 'conversion_over_time',
    category: 'behavior',
    title: 'Conversion rate over time',
    description: 'Share of sessions that placed an order.',
    usesSessions: true,
  },
  {
    key: 'conversion_funnel',
    category: 'behavior',
    title: 'Conversion funnel',
    description: 'Sessions that viewed a product, added to cart, reached checkout and ordered.',
    usesSessions: true,
  },
  {
    key: 'product_views_to_cart',
    category: 'behavior',
    title: 'Product views and add-to-cart rate',
    description: 'How often a product view leads to adding it to the cart.',
    usesSessions: true,
  },
  {
    key: 'new_vs_returning_customers',
    category: 'customers',
    title: 'New vs returning customers',
    description: 'Customers ordering for the first time and customers who ordered before.',
    usesSessions: false,
  },
  {
    key: 'returning_customer_rate',
    category: 'customers',
    title: 'Returning customer rate',
    description: 'Share of buying customers who had ordered before.',
    usesSessions: false,
  },
  {
    key: 'first_vs_repeat_sales',
    category: 'customers',
    title: 'First-time vs repeat sales',
    description: 'Orders and sales from first orders and repeat orders.',
    usesSessions: false,
  },
  {
    key: 'customers_by_country',
    category: 'customers',
    title: 'Customers by country',
    description: 'Buying customers, orders and sales by shipping country.',
    usesSessions: false,
  },
  {
    key: 'marketing_by_utm_source',
    category: 'marketing',
    title: 'Sessions and sales by UTM source',
    description: 'Visits, orders and sales attributed to each utm_source.',
    usesSessions: true,
  },
  {
    key: 'marketing_by_utm_campaign',
    category: 'marketing',
    title: 'Sessions and sales by UTM campaign',
    description: 'Visits, orders and sales attributed to each utm_campaign.',
    usesSessions: true,
  },
  {
    key: 'orders_over_time',
    category: 'orders',
    title: 'Orders over time',
    description: 'Number of placed orders.',
    usesSessions: false,
  },
  {
    key: 'fulfillment_status',
    category: 'orders',
    title: 'Orders by fulfillment status',
    description: 'Placed orders by where they are in fulfillment.',
    usesSessions: false,
  },
  {
    key: 'fulfillment_time',
    category: 'orders',
    title: 'Time to fulfill',
    description: 'Average hours from an order being placed to its first fulfillment.',
    usesSessions: false,
  },
  {
    key: 'returns_over_time',
    category: 'orders',
    title: 'Returns over time',
    description: 'Return requests, returned items and return reasons.',
    usesSessions: false,
  },
  {
    key: 'refunds_over_time',
    category: 'orders',
    title: 'Refunds over time',
    description: 'Refunds issued and their amounts.',
    usesSessions: false,
  },
  {
    key: 'stock_on_hand',
    category: 'inventory',
    title: 'Stock on hand',
    description: 'Available, committed and incoming units by variant and location.',
    usesSessions: false,
    ignoresRange: true,
  },
  {
    key: 'low_stock',
    category: 'inventory',
    title: 'Low stock',
    description: 'Tracked variants with few units left across all locations.',
    usesSessions: false,
    ignoresRange: true,
  },
  {
    key: 'days_of_stock',
    category: 'inventory',
    title: 'Days of stock left',
    description: 'How long current stock lasts at the last 30 days’ sales rate.',
    usesSessions: false,
    ignoresRange: true,
  },
  {
    key: 'finance_summary',
    category: 'finance',
    title: 'Finance summary',
    description: 'Gross sales, discounts, returns, net sales, shipping, taxes and total sales.',
    usesSessions: false,
  },
  {
    key: 'payments',
    category: 'finance',
    title: 'Payments by method and status',
    description: 'Orders and amounts by payment method and payment status.',
    usesSessions: false,
  },
] as const satisfies readonly ReportDefinition[]

export type AnalyticsReportDefinition = (typeof ANALYTICS_REPORTS)[number]

export type AnalyticsReportKey = AnalyticsReportDefinition['key']

export const ANALYTICS_REPORT_KEYS = ANALYTICS_REPORTS.map(({ key }) => key) as [
  AnalyticsReportKey,
  ...AnalyticsReportKey[],
]

export function analyticsReport(key: AnalyticsReportKey): AnalyticsReportDefinition {
  return ANALYTICS_REPORTS.find((report) => report.key === key)!
}
