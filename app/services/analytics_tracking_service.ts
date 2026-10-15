import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import { v7 as uuidv7 } from 'uuid'
import {
  ANALYTICS_EVENT_RETENTION_MONTHS,
  ANALYTICS_SESSION_COOKIE,
  ANALYTICS_SESSION_TIMEOUT_MINUTES,
  ANALYTICS_VISITOR_COOKIE,
  ANALYTICS_VISITOR_COOKIE_DAYS,
  type AnalyticsEventType,
} from '#constants/analytics'
import AnalyticsSessionRepository from '#repositories/analytics_session_repository'
import CheckoutService from '#services/checkout_service'
import StorefrontMarketService from '#services/storefront_market_service'
import env from '#start/env'
import {
  deviceTypeFor,
  isBotUserAgent,
  referrerHostOf,
  trafficSourceFor,
} from '#utils/analytics_traffic'

export type TrackEventInput = {
  type: AnalyticsEventType
  path: string
  productId?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  hasClickId?: boolean
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const storeHost = referrerHostOf(env.get('APP_URL'))

/**
 * First-party storefront tracking. A visitor cookie (13 months) groups
 * sessions; a session cookie ends after 30 minutes without activity. No IP
 * address or user agent is stored, and bots or shoppers who send Global
 * Privacy Control / Do Not Track are not tracked.
 */
@inject()
export default class AnalyticsTrackingService {
  constructor(
    protected analyticsSessionRepository: AnalyticsSessionRepository,
    protected storefrontMarketService: StorefrontMarketService,
    protected checkoutService: CheckoutService
  ) {}

  shouldTrack(ctx: HttpContext): boolean {
    const gpc = ctx.request.header('sec-gpc')
    const dnt = ctx.request.header('dnt')
    if (gpc === '1' || dnt === '1') return false
    return !isBotUserAgent(ctx.request.header('user-agent'))
  }

  /** Returns false when the request was not tracked (bot, GPC or DNT). */
  async track(ctx: HttpContext, input: TrackEventInput): Promise<boolean> {
    if (!this.shouldTrack(ctx)) return false

    const now = new Date()
    const sessionId =
      (await this.activeSessionId(ctx, now)) ?? (await this.startSession(ctx, input, now))

    await this.analyticsSessionRepository.recordEvent(
      sessionId,
      { type: input.type, path: input.path, productId: input.productId ?? null },
      now
    )
    this.rememberSession(ctx, sessionId)
    return true
  }

  /**
   * Marks the shopper's current session as converted. Tracking must never
   * block checkout, so failures are logged and the order goes through.
   */
  async recordOrderPlaced(ctx: HttpContext, orderId: string, path: string): Promise<void> {
    try {
      if (!this.shouldTrack(ctx)) return
      const now = new Date()
      const sessionId = await this.activeSessionId(ctx, now)
      if (!sessionId) return
      await this.analyticsSessionRepository.recordEvent(
        sessionId,
        { type: 'order_placed', path, productId: null, orderId },
        now
      )
      this.rememberSession(ctx, sessionId)
    } catch (error) {
      logger.warn(
        { err: error, orderId, event: 'analytics_conversion_failed' },
        'Could not record the order conversion'
      )
    }
  }

  async prune(): Promise<number> {
    const cutoff = DateTime.now().minus({ months: ANALYTICS_EVENT_RETENTION_MONTHS }).toJSDate()
    return this.analyticsSessionRepository.pruneEventsBefore(cutoff)
  }

  protected async activeSessionId(ctx: HttpContext, now: Date): Promise<string | null> {
    const cookie = ctx.request.encryptedCookie(ANALYTICS_SESSION_COOKIE)
    if (typeof cookie !== 'string' || !UUID_PATTERN.test(cookie)) return null
    const activeSince = new Date(now.getTime() - ANALYTICS_SESSION_TIMEOUT_MINUTES * 60_000)
    return this.analyticsSessionRepository.findActiveId(cookie, activeSince)
  }

  protected async startSession(ctx: HttpContext, input: TrackEventInput, now: Date) {
    const cookie = ctx.request.encryptedCookie(ANALYTICS_VISITOR_COOKIE)
    const visitorId = typeof cookie === 'string' && UUID_PATTERN.test(cookie) ? cookie : uuidv7()
    ctx.response.encryptedCookie(ANALYTICS_VISITOR_COOKIE, visitorId, {
      maxAge: `${ANALYTICS_VISITOR_COOKIE_DAYS}d`,
      httpOnly: true,
      sameSite: 'lax',
    })

    const [market, customer] = await Promise.all([
      this.storefrontMarketService.current(ctx),
      this.checkoutService.customerFor(ctx.auth.use('customer').user),
    ])
    const referrerHost = referrerHostOf(input.referrer)

    return this.analyticsSessionRepository.create(
      {
        visitorId,
        customerId: customer?.id ?? null,
        marketId: market.id,
        landingPath: input.path,
        referrerHost: referrerHost === storeHost ? null : referrerHost,
        source: trafficSourceFor({
          referrerHost,
          storeHost,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          hasClickId: input.hasClickId,
        }),
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
        deviceType: deviceTypeFor(ctx.request.header('user-agent')),
      },
      now
    )
  }

  protected rememberSession(ctx: HttpContext, sessionId: string) {
    ctx.response.encryptedCookie(ANALYTICS_SESSION_COOKIE, sessionId, {
      maxAge: `${ANALYTICS_SESSION_TIMEOUT_MINUTES}m`,
      httpOnly: true,
      sameSite: 'lax',
    })
  }
}
