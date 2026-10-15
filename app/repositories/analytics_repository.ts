import db from '@adonisjs/lucid/services/db'
import type { AnalyticsGrain } from '#constants/analytics'

type Rows<T> = { rows: T[] }

type Raw = Record<string, string | number | null>

/** Time bucket key (`YYYY-MM-DDTHH:MI`, store timezone); must match the service's keys. */
const bucketOf = (column: string) =>
  `to_char(date_trunc(?, ${column} at time zone ?), 'YYYY-MM-DD"T"HH24:MI')`

const num = (value: string | number | null | undefined) => Number(value ?? 0)

export type SalesBucketRow = {
  bucket: string
  orders: number
  gross: number
  discounts: number
  returns: number
  shipping: number
  taxes: number
  total: number
}

export type ProductSalesRow = {
  title: string
  orders: number
  units: number
  sales: number
}

export type VariantSalesRow = {
  title: string
  variantTitle: string | null
  sku: string | null
  units: number
  sales: number
}

export type MarketSalesRow = {
  name: string | null
  currencyCode: string
  orders: number
  sales: number
}

export type DiscountSalesRow = {
  code: string
  orders: number
  discounts: number
  sales: number
}

export type BuyerBucketRow = {
  bucket: string
  newCustomers: number
  returningCustomers: number
  firstOrders: number
  repeatOrders: number
  firstSales: number
  repeatSales: number
}

export type CountryRow = {
  countryCode: string | null
  customers: number
  orders: number
  sales: number
}

export type StatusCountRow = { status: string | null; orders: number }

export type FulfillmentTimeRow = { bucket: string; fulfilled: number; hours: number }

export type ReturnBucketRow = { bucket: string; returns: number; items: number }

export type ReturnReasonRow = { reason: string; returns: number; items: number }

export type RefundBucketRow = { bucket: string; refunds: number; amount: number }

export type StockRow = {
  title: string
  variantTitle: string
  sku: string | null
  location: string
  available: number
  committed: number
  incoming: number
}

export type LowStockRow = {
  title: string
  variantTitle: string
  sku: string | null
  available: number
}

export type DaysOfStockRow = LowStockRow & { soldRecently: number }

export type PaymentRow = {
  method: string | null
  status: string | null
  orders: number
  amount: number
}

export type UtmPerformanceRow = {
  label: string | null
  sessions: number
  orders: number
  sales: number
}

export type LiveOrderTotals = { orders: number; sales: number }

/**
 * Read-only aggregates for analytics reports. Like the dashboard, only
 * placed orders (`status = 'open'`) count, dated by `completed_at`;
 * amounts are limited to the store currency unless a report groups by
 * currency.
 */
export default class AnalyticsRepository {
  async salesSeries(
    from: Date,
    to: Date,
    grain: AnalyticsGrain,
    timezone: string,
    currencyCode: string
  ): Promise<SalesBucketRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select ${bucketOf('completed_at')} as "bucket",
              count(*)::int as "orders",
              coalesce(sum(subtotal), 0) as "gross",
              coalesce(sum(discount_total + shipping_discount_total), 0) as "discounts",
              coalesce(sum(refunded_total), 0) as "returns",
              coalesce(sum(shipping_total + shipping_discount_total), 0) as "shipping",
              coalesce(sum(tax_total), 0) as "taxes",
              coalesce(sum(total - refunded_total), 0) as "total"
       from orders
       where status = 'open' and currency_code = ? and completed_at >= ? and completed_at < ?
       group by 1`,
      [grain, timezone, currencyCode, from, to]
    )
    return result.rows.map((row) => ({
      bucket: String(row.bucket),
      orders: num(row.orders),
      gross: num(row.gross),
      discounts: num(row.discounts),
      returns: num(row.returns),
      shipping: num(row.shipping),
      taxes: num(row.taxes),
      total: num(row.total),
    }))
  }

  /** Units and sales per product (net of refunded units); deleted variants group by their snapshot title. */
  async productSales(
    from: Date,
    to: Date,
    currencyCode: string,
    limit: number
  ): Promise<ProductSalesRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select max(coalesce(p.title, li.product_title)) as "title",
              count(distinct o.id)::int as "orders",
              coalesce(sum(li.quantity - li.refunded_quantity), 0)::int as "units",
              coalesce(sum(li.line_total - li.refunded_quantity * li.unit_price), 0) as "sales"
       from order_line_items li
       join orders o on o.id = li.order_id
       left join product_variants v on v.id = li.product_variant_id
       left join products p on p.id = v.product_id
       where o.status = 'open' and o.currency_code = ? and o.completed_at >= ? and o.completed_at < ?
       group by coalesce(v.product_id::text, li.product_title)
       order by 4 desc, 3 desc
       limit ?`,
      [currencyCode, from, to, limit]
    )
    return result.rows.map((row) => ({
      title: String(row.title),
      orders: num(row.orders),
      units: num(row.units),
      sales: num(row.sales),
    }))
  }

  async variantSales(
    from: Date,
    to: Date,
    currencyCode: string,
    limit: number
  ): Promise<VariantSalesRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select li.product_title as "title",
              li.variant_title as "variantTitle",
              li.sku as "sku",
              coalesce(sum(li.quantity - li.refunded_quantity), 0)::int as "units",
              coalesce(sum(li.line_total - li.refunded_quantity * li.unit_price), 0) as "sales"
       from order_line_items li
       join orders o on o.id = li.order_id
       where o.status = 'open' and o.currency_code = ? and o.completed_at >= ? and o.completed_at < ?
       group by li.product_title, li.variant_title, li.sku
       order by 5 desc, 4 desc
       limit ?`,
      [currencyCode, from, to, limit]
    )
    return result.rows.map((row) => ({
      title: String(row.title),
      variantTitle: row.variantTitle === null ? null : String(row.variantTitle),
      sku: row.sku === null ? null : String(row.sku),
      units: num(row.units),
      sales: num(row.sales),
    }))
  }

  /** Per market and currency; never add these amounts across currencies. */
  async marketSales(from: Date, to: Date): Promise<MarketSalesRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select m.name as "name",
              o.currency_code as "currencyCode",
              count(*)::int as "orders",
              coalesce(sum(o.total - o.refunded_total), 0) as "sales"
       from orders o
       left join markets m on m.id = o.market_id
       where o.status = 'open' and o.completed_at >= ? and o.completed_at < ?
       group by o.market_id, m.name, o.currency_code
       order by 3 desc`,
      [from, to]
    )
    return result.rows.map((row) => ({
      name: row.name === null ? null : String(row.name),
      currencyCode: String(row.currencyCode),
      orders: num(row.orders),
      sales: num(row.sales),
    }))
  }

  async discountSales(
    from: Date,
    to: Date,
    currencyCode: string,
    limit: number
  ): Promise<DiscountSalesRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select code as "code",
              count(*)::int as "orders",
              coalesce(sum(amount), 0) as "discounts",
              coalesce(sum(sales), 0) as "sales"
       from (
         select coalesce(discount_code, discount_title) as code, discount_total as amount,
                total - refunded_total as sales
         from orders
         where status = 'open' and currency_code = ? and completed_at >= ? and completed_at < ?
           and discount_total > 0
         union all
         select coalesce(shipping_discount_code, shipping_discount_title), shipping_discount_total,
                total - refunded_total
         from orders
         where status = 'open' and currency_code = ? and completed_at >= ? and completed_at < ?
           and shipping_discount_total > 0
       ) as applied
       group by 1
       order by 3 desc
       limit ?`,
      [currencyCode, from, to, currencyCode, from, to, limit]
    )
    return result.rows.map((row) => ({
      code: String(row.code ?? 'Discount'),
      orders: num(row.orders),
      discounts: num(row.discounts),
      sales: num(row.sales),
    }))
  }

  /**
   * New vs returning buyers per bucket. A buyer is the customer, or the
   * email for guest orders; "new" means their first ever order is in the
   * bucket. Sales only include the store currency.
   */
  async buyerSeries(
    from: Date,
    to: Date,
    grain: AnalyticsGrain | null,
    timezone: string,
    currencyCode: string
  ): Promise<BuyerBucketRow[]> {
    const bucket = grain ? bucketOf('completed_at') : `'all'`
    const result = await db.rawQuery<Rows<Raw>>(
      `with ranked as (
         select completed_at,
                currency_code,
                total - refunded_total as sales,
                coalesce(customer_id::text, lower(email)) as buyer,
                row_number() over (
                  partition by coalesce(customer_id::text, lower(email)) order by completed_at
                ) as nth
         from orders
         where status = 'open' and completed_at < ?
           and (customer_id is not null or email is not null)
       ), per_buyer as (
         select ${bucket} as bucket,
                buyer,
                min(nth) as first_nth,
                count(*) as orders,
                count(*) filter (where nth = 1) as first_orders,
                coalesce(sum(sales) filter (where nth = 1 and currency_code = ?), 0) as first_sales,
                coalesce(sum(sales) filter (where nth > 1 and currency_code = ?), 0) as repeat_sales
         from ranked
         where completed_at >= ?
         group by 1, 2
       )
       select bucket as "bucket",
              count(*) filter (where first_nth = 1)::int as "newCustomers",
              count(*) filter (where first_nth > 1)::int as "returningCustomers",
              coalesce(sum(first_orders), 0)::int as "firstOrders",
              coalesce(sum(orders - first_orders), 0)::int as "repeatOrders",
              coalesce(sum(first_sales), 0) as "firstSales",
              coalesce(sum(repeat_sales), 0) as "repeatSales"
       from per_buyer
       group by 1`,
      [to, ...(grain ? [grain, timezone] : []), currencyCode, currencyCode, from]
    )
    return result.rows.map((row) => ({
      bucket: String(row.bucket),
      newCustomers: num(row.newCustomers),
      returningCustomers: num(row.returningCustomers),
      firstOrders: num(row.firstOrders),
      repeatOrders: num(row.repeatOrders),
      firstSales: num(row.firstSales),
      repeatSales: num(row.repeatSales),
    }))
  }

  async customersByCountry(
    from: Date,
    to: Date,
    currencyCode: string,
    limit: number
  ): Promise<CountryRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select shipping_address->>'countryCode' as "countryCode",
              count(distinct coalesce(customer_id::text, lower(email)))::int as "customers",
              count(*)::int as "orders",
              coalesce(sum(total - refunded_total) filter (where currency_code = ?), 0) as "sales"
       from orders
       where status = 'open' and completed_at >= ? and completed_at < ?
       group by 1
       order by 2 desc, 3 desc
       limit ?`,
      [currencyCode, from, to, limit]
    )
    return result.rows.map((row) => ({
      countryCode: row.countryCode === null ? null : String(row.countryCode),
      customers: num(row.customers),
      orders: num(row.orders),
      sales: num(row.sales),
    }))
  }

  async ordersByStatus(
    column: 'fulfillment_status' | 'payment_status',
    from: Date,
    to: Date
  ): Promise<StatusCountRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select ${column} as "status", count(*)::int as "orders"
       from orders
       where status = 'open' and completed_at >= ? and completed_at < ?
       group by 1
       order by 2 desc`,
      [from, to]
    )
    return result.rows.map((row) => ({
      status: row.status === null ? null : String(row.status),
      orders: num(row.orders),
    }))
  }

  /** Hours from placing an order to its first (not cancelled) fulfillment. */
  async fulfillmentTimeSeries(
    from: Date,
    to: Date,
    grain: AnalyticsGrain,
    timezone: string
  ): Promise<FulfillmentTimeRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select ${bucketOf('x.completed_at')} as "bucket",
              count(*)::int as "fulfilled",
              coalesce(avg(extract(epoch from (x.first_at - x.completed_at)) / 3600), 0) as "hours"
       from (
         select o.id, o.completed_at, min(f.created_at) as first_at
         from orders o
         join fulfillments f on f.order_id = o.id and f.cancelled_at is null
         where o.status = 'open' and o.completed_at >= ? and o.completed_at < ?
         group by o.id, o.completed_at
       ) x
       group by 1`,
      [grain, timezone, from, to]
    )
    return result.rows.map((row) => ({
      bucket: String(row.bucket),
      fulfilled: num(row.fulfilled),
      hours: num(row.hours),
    }))
  }

  async returnsSeries(
    from: Date,
    to: Date,
    grain: AnalyticsGrain,
    timezone: string
  ): Promise<ReturnBucketRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select ${bucketOf('r.requested_at')} as "bucket",
              count(distinct r.id)::int as "returns",
              coalesce(sum(rli.quantity), 0)::int as "items"
       from returns r
       left join return_line_items rli on rli.return_id = r.id
       where r.requested_at >= ? and r.requested_at < ?
       group by 1`,
      [grain, timezone, from, to]
    )
    return result.rows.map((row) => ({
      bucket: String(row.bucket),
      returns: num(row.returns),
      items: num(row.items),
    }))
  }

  async returnReasons(from: Date, to: Date): Promise<ReturnReasonRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select rli.reason as "reason",
              count(distinct r.id)::int as "returns",
              coalesce(sum(rli.quantity), 0)::int as "items"
       from returns r
       join return_line_items rli on rli.return_id = r.id
       where r.requested_at >= ? and r.requested_at < ?
       group by 1
       order by 3 desc`,
      [from, to]
    )
    return result.rows.map((row) => ({
      reason: String(row.reason),
      returns: num(row.returns),
      items: num(row.items),
    }))
  }

  /** Succeeded refunds by the date they were issued, store currency only. */
  async refundsSeries(
    from: Date,
    to: Date,
    grain: AnalyticsGrain,
    timezone: string,
    currencyCode: string
  ): Promise<RefundBucketRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select ${bucketOf('rf.created_at')} as "bucket",
              count(*)::int as "refunds",
              coalesce(sum(rf.amount), 0) as "amount"
       from refunds rf
       join orders o on o.id = rf.order_id
       where rf.status = 'succeeded' and o.currency_code = ?
         and rf.created_at >= ? and rf.created_at < ?
       group by 1`,
      [grain, timezone, currencyCode, from, to]
    )
    return result.rows.map((row) => ({
      bucket: String(row.bucket),
      refunds: num(row.refunds),
      amount: num(row.amount),
    }))
  }

  async stockOnHand(limit: number): Promise<StockRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select p.title as "title",
              v.title as "variantTitle",
              v.sku as "sku",
              loc.name as "location",
              l.available as "available",
              l.committed as "committed",
              l.incoming as "incoming"
       from inventory_levels l
       join product_variants v on v.id = l.product_variant_id
       join products p on p.id = v.product_id
       join locations loc on loc.id = l.location_id
       where v.track_inventory = true and p.archived_at is null
       order by p.title asc, v.position asc, loc.name asc
       limit ?`,
      [limit]
    )
    return result.rows.map((row) => ({
      title: String(row.title),
      variantTitle: String(row.variantTitle),
      sku: row.sku === null ? null : String(row.sku),
      location: String(row.location),
      available: num(row.available),
      committed: num(row.committed),
      incoming: num(row.incoming),
    }))
  }

  async lowStock(threshold: number, limit: number): Promise<LowStockRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select p.title as "title",
              v.title as "variantTitle",
              v.sku as "sku",
              coalesce(sum(l.available), 0)::int as "available"
       from product_variants v
       join products p on p.id = v.product_id
       left join inventory_levels l on l.product_variant_id = v.id
       where v.track_inventory = true and p.archived_at is null
       group by v.id, p.title, v.title, v.sku
       having coalesce(sum(l.available), 0) <= ?
       order by 4 asc, 1 asc
       limit ?`,
      [threshold, limit]
    )
    return result.rows.map((row) => ({
      title: String(row.title),
      variantTitle: String(row.variantTitle),
      sku: row.sku === null ? null : String(row.sku),
      available: num(row.available),
    }))
  }

  /** Stock on hand next to units sold since `soldSince`, for tracked variants that sold. */
  async stockAndSales(soldSince: Date, limit: number): Promise<DaysOfStockRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `with sold as (
         select li.product_variant_id, sum(li.quantity - li.refunded_quantity) as units
         from order_line_items li
         join orders o on o.id = li.order_id
         where o.status = 'open' and o.completed_at >= ? and li.product_variant_id is not null
         group by li.product_variant_id
       ), stock as (
         select product_variant_id, sum(available) as available
         from inventory_levels
         group by product_variant_id
       )
       select p.title as "title",
              v.title as "variantTitle",
              v.sku as "sku",
              coalesce(st.available, 0)::int as "available",
              s.units::int as "soldRecently"
       from sold s
       join product_variants v on v.id = s.product_variant_id
       join products p on p.id = v.product_id
       left join stock st on st.product_variant_id = v.id
       where v.track_inventory = true and p.archived_at is null and s.units > 0
       order by coalesce(st.available, 0)::numeric / s.units asc
       limit ?`,
      [soldSince, limit]
    )
    return result.rows.map((row) => ({
      title: String(row.title),
      variantTitle: String(row.variantTitle),
      sku: row.sku === null ? null : String(row.sku),
      available: num(row.available),
      soldRecently: num(row.soldRecently),
    }))
  }

  async payments(from: Date, to: Date, currencyCode: string): Promise<PaymentRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select payment_method as "method",
              payment_status as "status",
              count(*)::int as "orders",
              coalesce(sum(total) filter (where currency_code = ?), 0) as "amount"
       from orders
       where status = 'open' and completed_at >= ? and completed_at < ?
       group by 1, 2
       order by 3 desc`,
      [currencyCode, from, to]
    )
    return result.rows.map((row) => ({
      method: row.method === null ? null : String(row.method),
      status: row.status === null ? null : String(row.status),
      orders: num(row.orders),
      amount: num(row.amount),
    }))
  }

  /** Sessions, converted orders and their sales by a UTM tag. */
  async utmPerformance(
    column: 'utm_source' | 'utm_campaign',
    from: Date,
    to: Date,
    currencyCode: string,
    limit: number
  ): Promise<UtmPerformanceRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select s.${column} as "label",
              count(*)::int as "sessions",
              count(o.id)::int as "orders",
              coalesce(sum(o.total - o.refunded_total) filter (where o.currency_code = ?), 0) as "sales"
       from analytics_sessions s
       left join orders o on o.id = s.converted_order_id and o.status = 'open'
       where s.started_at >= ? and s.started_at < ? and s.${column} is not null
       group by 1
       order by 2 desc
       limit ?`,
      [currencyCode, from, to, limit]
    )
    return result.rows.map((row) => ({
      label: row.label === null ? null : String(row.label),
      sessions: num(row.sessions),
      orders: num(row.orders),
      sales: num(row.sales),
    }))
  }

  /** Sales per traffic source of the session that placed the order. */
  async salesBySource(from: Date, to: Date, currencyCode: string): Promise<UtmPerformanceRow[]> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select s.source as "label",
              count(*)::int as "sessions",
              count(o.id)::int as "orders",
              coalesce(sum(o.total - o.refunded_total) filter (where o.currency_code = ?), 0) as "sales"
       from analytics_sessions s
       left join orders o on o.id = s.converted_order_id and o.status = 'open'
       where s.started_at >= ? and s.started_at < ?
       group by 1
       order by 4 desc, 2 desc`,
      [currencyCode, from, to]
    )
    return result.rows.map((row) => ({
      label: row.label === null ? null : String(row.label),
      sessions: num(row.sessions),
      orders: num(row.orders),
      sales: num(row.sales),
    }))
  }

  async orderTotalsSince(from: Date, currencyCode: string): Promise<LiveOrderTotals> {
    const result = await db.rawQuery<Rows<Raw>>(
      `select count(*)::int as "orders",
              coalesce(sum(total - refunded_total) filter (where currency_code = ?), 0) as "sales"
       from orders
       where status = 'open' and completed_at >= ?`,
      [currencyCode, from]
    )
    const row = result.rows[0]
    return { orders: num(row.orders), sales: num(row.sales) }
  }
}
