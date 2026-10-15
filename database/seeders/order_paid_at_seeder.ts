import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import OrderService from '#services/order_service'

/**
 * Sets the payment date (used on receipts) of paid orders placed before
 * it was recorded. Safe to re-run.
 */
export default class extends BaseSeeder {
  async run() {
    const orderService = await app.container.make(OrderService)
    await orderService.backfillPaidAt()
  }
}
