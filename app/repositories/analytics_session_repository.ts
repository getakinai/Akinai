import db from '@adonisjs/lucid/services/db'
import { v7 as uuidv7 } from 'uuid'
import AnalyticsEvent from '#models/analytics_event'
import type { AnalyticsDeviceType, AnalyticsEventType, AnalyticsSource } from '#constants/analytics'

type Rows<T> = { rows: T[] }

export type NewAnalyticsSession = {
  visitorId: string
  customerId: string | null
  marketId: string | null
  landingPath: string
  referrerHost: string | null
  source: AnalyticsSource
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  deviceType: AnalyticsDeviceType
}

export type AnalyticsEventInput = {
  type: AnalyticsEventType
  path: string
  productId: string | null
  orderId?: string | null
}

export type SeriesRow = { bucket: string; value: number }

export type SessionTotals = {
  sessions: number
  visitors: number
  viewedProduct: number
  addedToCart: number
  reachedCheckout: number
  converted: number
}

export type LabelledCount = { label: string | null; sessions: number; converted: number }

export type LiveCounts = {
  visitorsNow: number
  sessionsToday: number
  activeCarts: number
  activeCheckouts: number
}

export type LivePageRow = { path: string; views: number }

export type ProductViewRow = {
  productId: string
  title: string | null
  views: number
  addedToCart: number
}

const SESSION_FLAG_FOR: Partial<Record<AnalyticsEventType, string>> = {
  product_view: 'viewed_product',
  add_to_cart: 'added_to_cart',
  checkout_started: 'reached_checkout',
  order_placed: 'reached_checkout',
}

/**
 * Storefront sessions and events: the writes made by the tracking beacon
 * and the read-only aggregates behind the analytics reports.
 */
export default class AnalyticsSessionRepository {
  /** The session id if it is still active (seen after `activeSince`). */
  async findActiveId(sessionId: string, activeSince: Date): Promise<string | null> {
    const result = await db.rawQuery<Rows<{ id: string }>>(
      `select id from analytics_sessions where id = ? and last_seen_at >= ? limit 1`,
      [sessionId, activeSince]
    )
    return result.rows[0]?.id ?? null
  }

  async create(session: NewAnalyticsSession, now: Date): Promise<string> {
    const id = uuidv7()
    await db.table('analytics_sessions').insert({
      id,
      visitor_id: session.visitorId,
      customer_id: session.customerId,
      market_id: session.marketId,
      started_at: now,
      last_seen_at: now,
      landing_path: session.landingPath,
      referrer_host: session.referrerHost,
      source: session.source,
      utm_source: session.utmSource,
      utm_medium: session.utmMedium,
      utm_campaign: session.utmCampaign,
      device_type: session.deviceType,
      page_views: 0,
      viewed_product: false,
      added_to_cart: false,
      reached_checkout: false,
      created_at: now,
      updated_at: now,
    })
    return id
  }

  /**
   * Records one event and updates the session's counters and funnel flags
   * in one transaction. Unknown product ids are stored as null.
   */
  async recordEvent(sessionId: string, event: AnalyticsEventInput, now: Date): Promise<void> {
    const flag = SESSION_FLAG_FOR[event.type]
    await db.transaction(async (trx) => {
      await trx.rawQuery(
        `update analytics_sessions
         set last_seen_at = ?,
             updated_at = ?,
             page_views = page_views + ?
             ${flag ? `, ${flag} = true` : ''}
             ${event.orderId ? ', converted_order_id = coalesce(converted_order_id, ?)' : ''}
         where id = ?`,
        [
          now,
          now,
          event.type === 'page_view' ? 1 : 0,
          ...(event.orderId ? [event.orderId] : []),
          sessionId,
        ]
      )
      await trx.rawQuery(
        `insert into analytics_events (id, session_id, type, path, product_id, occurred_at, created_at, updated_at)
         values (?, ?, ?, ?, ${event.productId ? '(select id from products where id = ?)' : 'null'}, ?, ?, ?)`,
        [
          uuidv7(),
          sessionId,
          event.type,
          event.path,
          ...(event.productId ? [event.productId] : []),
          now,
          now,
          now,
        ]
      )
    })
  }

  async pruneEventsBefore(cutoff: Date): Promise<number> {
    const deleted = await AnalyticsEvent.query().where('occurred_at', '<', cutoff).delete()
    return Number(Array.isArray(deleted) ? deleted[0] : deleted)
  }

  /** When the first session was recorded; null before tracking started. */
  async firstSessionAt(): Promise<Date | null> {
    const result = await db.rawQuery<Rows<{ first: Date | null }>>(
      `select min(started_at) as "first" from analytics_sessions`
    )
    return result.rows[0]?.first ?? null
  }

  async totals(from: Date, to: Date): Promise<SessionTotals> {
    const result = await db.rawQuery<Rows<Record<keyof SessionTotals, number>>>(
      `select count(*)::int as "sessions",
              count(distinct visitor_id)::int as "visitors",
              count(*) filter (where viewed_product)::int as "viewedProduct",
              count(*) filter (where added_to_cart)::int as "addedToCart",
              count(*) filter (where reached_checkout)::int as "reachedCheckout",
              count(*) filter (where converted_order_id is not null)::int as "converted"
       from analytics_sessions
       where started_at >= ? and started_at < ?`,
      [from, to]
    )
    const row = result.rows[0]
    return {
      sessions: Number(row.sessions),
      visitors: Number(row.visitors),
      viewedProduct: Number(row.viewedProduct),
      addedToCart: Number(row.addedToCart),
      reachedCheckout: Number(row.reachedCheckout),
      converted: Number(row.converted),
    }
  }

  /**
   * Sessions (and converted sessions) per time bucket in the store
   * timezone. Buckets with no sessions are filled in by the service.
   */
  async series(
    from: Date,
    to: Date,
    grain: string,
    timezone: string
  ): Promise<{ bucket: string; sessions: number; converted: number }[]> {
    const result = await db.rawQuery<Rows<{ bucket: string; sessions: number; converted: number }>>(
      `select to_char(date_trunc(?, started_at at time zone ?), 'YYYY-MM-DD"T"HH24:MI') as "bucket",
              count(*)::int as "sessions",
              count(*) filter (where converted_order_id is not null)::int as "converted"
       from analytics_sessions
       where started_at >= ? and started_at < ?
       group by 1`,
      [grain, timezone, from, to]
    )
    return result.rows.map((row) => ({
      bucket: row.bucket,
      sessions: Number(row.sessions),
      converted: Number(row.converted),
    }))
  }

  /** Sessions grouped by one whitelisted column. */
  async countBy(
    column:
      'source' | 'device_type' | 'landing_path' | 'referrer_host' | 'utm_campaign' | 'utm_source',
    from: Date,
    to: Date,
    limit: number
  ): Promise<LabelledCount[]> {
    const result = await db.rawQuery<Rows<LabelledCount>>(
      `select ${column} as "label",
              count(*)::int as "sessions",
              count(*) filter (where converted_order_id is not null)::int as "converted"
       from analytics_sessions
       where started_at >= ? and started_at < ?
       group by 1
       order by 2 desc, 1 asc nulls last
       limit ?`,
      [from, to, limit]
    )
    return result.rows.map((row) => ({
      label: row.label,
      sessions: Number(row.sessions),
      converted: Number(row.converted),
    }))
  }

  /** Product views and add-to-carts per product, most viewed first. */
  async productViews(from: Date, to: Date, limit: number): Promise<ProductViewRow[]> {
    const result = await db.rawQuery<Rows<ProductViewRow>>(
      `select e.product_id as "productId",
              p.title as "title",
              count(*) filter (where e.type = 'product_view')::int as "views",
              count(*) filter (where e.type = 'add_to_cart')::int as "addedToCart"
       from analytics_events e
       left join products p on p.id = e.product_id
       where e.product_id is not null
         and e.type in ('product_view', 'add_to_cart')
         and e.occurred_at >= ? and e.occurred_at < ?
       group by e.product_id, p.title
       order by 3 desc, 4 desc
       limit ?`,
      [from, to, limit]
    )
    return result.rows.map((row) => ({
      ...row,
      views: Number(row.views),
      addedToCart: Number(row.addedToCart),
    }))
  }

  async liveCounts(activeSince: Date, todayFrom: Date): Promise<LiveCounts> {
    const result = await db.rawQuery<Rows<Record<keyof LiveCounts, number>>>(
      `select
         count(*) filter (where last_seen_at >= ?)::int as "visitorsNow",
         count(*) filter (where started_at >= ?)::int as "sessionsToday",
         count(*) filter (where last_seen_at >= ? and added_to_cart and not reached_checkout and converted_order_id is null)::int as "activeCarts",
         count(*) filter (where last_seen_at >= ? and reached_checkout and converted_order_id is null)::int as "activeCheckouts"
       from analytics_sessions
       where last_seen_at >= ? or started_at >= ?`,
      [activeSince, todayFrom, activeSince, activeSince, activeSince, todayFrom]
    )
    const row = result.rows[0]
    return {
      visitorsNow: Number(row.visitorsNow),
      sessionsToday: Number(row.sessionsToday),
      activeCarts: Number(row.activeCarts),
      activeCheckouts: Number(row.activeCheckouts),
    }
  }

  async livePages(since: Date, limit: number): Promise<LivePageRow[]> {
    const result = await db.rawQuery<Rows<LivePageRow>>(
      `select path, count(*)::int as "views"
       from analytics_events
       where type = 'page_view' and occurred_at >= ?
       group by path
       order by 2 desc, 1 asc
       limit ?`,
      [since, limit]
    )
    return result.rows.map((row) => ({ path: row.path, views: Number(row.views) }))
  }

  /** Page views per minute since `since`, keyed `HH24:MI` in the store timezone. */
  async liveMinutes(since: Date, timezone: string): Promise<SeriesRow[]> {
    const result = await db.rawQuery<Rows<{ bucket: string; value: number }>>(
      `select to_char(date_trunc('minute', occurred_at at time zone ?), 'YYYY-MM-DD"T"HH24:MI') as "bucket",
              count(*)::int as "value"
       from analytics_events
       where type = 'page_view' and occurred_at >= ?
       group by 1`,
      [timezone, since]
    )
    return result.rows.map((row) => ({ bucket: row.bucket, value: Number(row.value) }))
  }
}
