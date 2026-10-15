import db from '@adonisjs/lucid/services/db'

export type PeriodTotals = {
  orders: number
  storeOrders: number
  revenue: number
  discounts: number
  unpaid: number
}

export type BuyerMix = { buyers: number; firstTime: number }

export type RegionRow = { province: string | null; countryCode: string | null; revenue: number }

export type MonthRow = { month: string; revenue: number; orders: number; discounts: number }

export type MarketSalesRow = {
  marketId: string | null
  name: string | null
  isPrimary: boolean
  currencyCode: string
  revenue: number
  orders: number
  previousRevenue: number
  previousOrders: number
}

export type ActiveMarketRow = {
  id: string
  name: string
  currencyCode: string
  isPrimary: boolean
}

export type TodoCounts = {
  toFulfill: number
  awaitingPayment: number
  paymentsToReview: number
  lowStock: number
  newReviews: number
  returnsToReview: number
}

export type RecentOrderRow = {
  id: string
  orderNumber: number | null
  customerName: string | null
  email: string | null
  total: number
  currencyCode: string
  paymentStatus: string | null
  fulfillmentStatus: string
  completedAt: Date
}

const FULFILLABLE_STATUSES = ['unfulfilled', 'in_progress', 'partially_fulfilled']

type Rows<T> = { rows: T[] }

/**
 * Read-only aggregates for the back-office dashboard. Only placed orders
 * (`status = 'open'`, so not cancelled) count; revenue is net of refunds
 * and, except for the per-market breakdown, only includes the store currency.
 */
export default class DashboardRepository {
  async periodTotals(from: Date, to: Date, currencyCode: string): Promise<PeriodTotals> {
    const result = await db.rawQuery<Rows<Record<keyof PeriodTotals, string | number>>>(
      `select
         count(*)::int as "orders",
         count(*) filter (where currency_code = ?)::int as "storeOrders",
         coalesce(sum(total - refunded_total) filter (where currency_code = ?), 0) as "revenue",
         coalesce(sum(discount_total + shipping_discount_total) filter (where currency_code = ?), 0) as "discounts",
         count(*) filter (where payment_status in ('pending', 'payment_submitted'))::int as "unpaid"
       from orders
       where status = 'open' and completed_at >= ? and completed_at < ?`,
      [currencyCode, currencyCode, currencyCode, from, to]
    )
    const row = result.rows[0]
    return {
      orders: Number(row.orders),
      storeOrders: Number(row.storeOrders),
      revenue: Number(row.revenue),
      discounts: Number(row.discounts),
      unpaid: Number(row.unpaid),
    }
  }

  /** Customers who ordered in the period, and how many ordered for the first time. */
  async buyerMix(from: Date, to: Date): Promise<BuyerMix> {
    const result = await db.rawQuery<Rows<{ buyers: number; firstTime: number }>>(
      `with buyers as (
         select distinct customer_id from orders
         where status = 'open' and customer_id is not null
           and completed_at >= ? and completed_at < ?
       ), firsts as (
         select o.customer_id, min(o.completed_at) as first_at
         from orders o
         join buyers b on b.customer_id = o.customer_id
         where o.status = 'open'
         group by o.customer_id
       )
       select count(*)::int as "buyers",
              count(*) filter (where first_at >= ?)::int as "firstTime"
       from firsts`,
      [from, to, from]
    )
    const row = result.rows[0]
    return { buyers: Number(row.buyers), firstTime: Number(row.firstTime) }
  }

  async topRegions(from: Date, to: Date, currencyCode: string, limit: number) {
    const result = await db.rawQuery<
      Rows<{ province: string | null; countryCode: string | null; revenue: string }>
    >(
      `select nullif(trim(shipping_address->>'province'), '') as "province",
              shipping_address->>'countryCode' as "countryCode",
              sum(total - refunded_total) as "revenue"
       from orders
       where status = 'open' and currency_code = ? and completed_at >= ? and completed_at < ?
       group by 1, 2
       order by sum(total - refunded_total) desc
       limit ?`,
      [currencyCode, from, to, limit]
    )
    return result.rows.map((row): RegionRow => ({
      province: row.province,
      countryCode: row.countryCode,
      revenue: Number(row.revenue),
    }))
  }

  /**
   * Sales per market and currency for the current period (`from`..`to`) and
   * the previous one (`previousFrom`..`from`). Orders whose market was
   * deleted come back with a null `marketId`.
   */
  async marketSales(previousFrom: Date, from: Date, to: Date): Promise<MarketSalesRow[]> {
    const result = await db.rawQuery<
      Rows<{
        marketId: string | null
        name: string | null
        isPrimary: boolean | null
        currencyCode: string
        revenue: string
        orders: number
        previousRevenue: string
        previousOrders: number
      }>
    >(
      `select o.market_id as "marketId",
              m.name as "name",
              m.is_primary as "isPrimary",
              o.currency_code as "currencyCode",
              coalesce(sum(o.total - o.refunded_total) filter (where o.completed_at >= ?), 0) as "revenue",
              count(*) filter (where o.completed_at >= ?)::int as "orders",
              coalesce(sum(o.total - o.refunded_total) filter (where o.completed_at < ?), 0) as "previousRevenue",
              count(*) filter (where o.completed_at < ?)::int as "previousOrders"
       from orders o
       left join markets m on m.id = o.market_id
       where o.status = 'open' and o.completed_at >= ? and o.completed_at < ?
       group by o.market_id, m.name, m.is_primary, o.currency_code`,
      [from, from, from, from, previousFrom, to]
    )
    return result.rows.map((row) => ({
      marketId: row.marketId,
      name: row.name,
      isPrimary: row.isPrimary === true,
      currencyCode: row.currencyCode,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
      previousRevenue: Number(row.previousRevenue),
      previousOrders: Number(row.previousOrders),
    }))
  }

  async activeMarkets(limit: number): Promise<ActiveMarketRow[]> {
    const result = await db.rawQuery<Rows<ActiveMarketRow>>(
      `select id, name, currency_code as "currencyCode", is_primary as "isPrimary"
       from markets
       where is_active = true
       order by is_primary desc, name asc
       limit ?`,
      [limit]
    )
    return result.rows
  }

  /** Sales per calendar month (in the store timezone) from `from` onwards. */
  async monthlySales(from: Date, currencyCode: string, timezone: string): Promise<MonthRow[]> {
    const result = await db.rawQuery<
      Rows<{ month: string; revenue: string; orders: number; discounts: string }>
    >(
      `select to_char(date_trunc('month', completed_at at time zone ?), 'YYYY-MM') as "month",
              coalesce(sum(total - refunded_total), 0) as "revenue",
              count(*)::int as "orders",
              coalesce(sum(discount_total + shipping_discount_total), 0) as "discounts"
       from orders
       where status = 'open' and currency_code = ? and completed_at >= ?
       group by 1`,
      [timezone, currencyCode, from]
    )
    return result.rows.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
      discounts: Number(row.discounts),
    }))
  }

  async todoCounts(lowStockThreshold: number, reviewsSince: Date): Promise<TodoCounts> {
    const result = await db.rawQuery<Rows<Record<keyof TodoCounts, number>>>(
      `select
         (select count(*)::int from orders
            where status = 'open' and archived_at is null
              and fulfillment_status in (${FULFILLABLE_STATUSES.map(() => '?').join(', ')})) as "toFulfill",
         (select count(*)::int from orders
            where status = 'open' and archived_at is null
              and payment_status = 'pending' and payment_method = 'bank_transfer') as "awaitingPayment",
         (select count(*)::int from orders
            where status = 'open' and archived_at is null
              and payment_status = 'payment_submitted') as "paymentsToReview",
         (select count(*)::int from (
            select v.id
            from product_variants v
            join products p on p.id = v.product_id
            left join inventory_levels l on l.product_variant_id = v.id
            where v.track_inventory = true and p.archived_at is null
            group by v.id
            having coalesce(sum(l.available), 0) <= ?
          ) low) as "lowStock",
         (select count(*)::int from product_reviews where created_at >= ?) as "newReviews",
         (select count(*)::int from returns where status = 'requested') as "returnsToReview"`,
      [...FULFILLABLE_STATUSES, lowStockThreshold, reviewsSince]
    )
    const row = result.rows[0]
    return {
      toFulfill: Number(row.toFulfill),
      awaitingPayment: Number(row.awaitingPayment),
      paymentsToReview: Number(row.paymentsToReview),
      lowStock: Number(row.lowStock),
      newReviews: Number(row.newReviews),
      returnsToReview: Number(row.returnsToReview),
    }
  }

  async recentOrders(limit: number): Promise<RecentOrderRow[]> {
    const result = await db.rawQuery<Rows<Omit<RecentOrderRow, 'total'> & { total: string }>>(
      `select o.id,
              o.order_number as "orderNumber",
              coalesce(nullif(c.full_name, ''), nullif(o.shipping_address->>'fullName', '')) as "customerName",
              o.email,
              o.total,
              o.currency_code as "currencyCode",
              o.payment_status as "paymentStatus",
              o.fulfillment_status as "fulfillmentStatus",
              o.completed_at as "completedAt"
       from orders o
       left join customers c on c.id = o.customer_id
       where o.status = 'open'
       order by o.completed_at desc
       limit ?`,
      [limit]
    )
    return result.rows.map((row) => ({ ...row, total: Number(row.total) }))
  }

  /** Countries of active markets, primary market first, to pad empty region slots. */
  async marketCountryCodes(limit: number): Promise<string[]> {
    const result = await db.rawQuery<Rows<{ countryCode: string }>>(
      `select mc.country_code as "countryCode"
       from market_countries mc
       join markets m on m.id = mc.market_id
       where m.is_active = true
       order by m.is_primary desc, mc.country_code asc
       limit ?`,
      [limit]
    )
    return result.rows.map((row) => row.countryCode)
  }
}
