import { BaseTransformer } from '@adonisjs/core/transformers'
import type { AnalyticsLive } from '#services/analytics_report_service'

/** Live View counts. Recent orders carry only what the list shows. */
export default class AnalyticsLiveTransformer extends BaseTransformer<AnalyticsLive> {
  toObject() {
    const live = this.resource
    return {
      generatedAt: live.generatedAt,
      money: live.money,
      windowMinutes: live.windowMinutes,
      visitorsNow: live.visitorsNow,
      sessionsToday: live.sessionsToday,
      ordersToday: live.ordersToday,
      salesToday: live.salesToday,
      activeCarts: live.activeCarts,
      activeCheckouts: live.activeCheckouts,
      topPages: live.topPages,
      minutes: live.minutes,
      recentOrders: live.recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        currencyCode: order.currencyCode,
        completedAt: order.completedAt,
      })),
    }
  }
}
