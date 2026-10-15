import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DashboardOverview } from '#services/dashboard_service'

/**
 * Raw dashboard numbers (amounts in the store currency, percents 0–100).
 * The page does all formatting.
 */
export default class DashboardTransformer extends BaseTransformer<DashboardOverview> {
  toObject() {
    const overview = this.resource
    return {
      ...overview,
      recentOrders: overview.recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        total: order.total,
        currencyCode: order.currencyCode,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        completedAt: new Date(order.completedAt).toISOString(),
      })),
    }
  }
}
