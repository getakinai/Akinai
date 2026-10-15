import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PaymentMethodService from '#services/payment_method_service'

/**
 * Assigns bank transfer and Stripe setups saved before payment methods
 * were per market to markets. Runs after the country preset seeder. Safe to re-run.
 */
export default class extends BaseSeeder {
  async run() {
    const paymentMethodService = await app.container.make(PaymentMethodService)
    await paymentMethodService.assignLegacySetupsToMarkets()
  }
}
