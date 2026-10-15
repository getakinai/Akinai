import { Secret } from '@adonisjs/core/helpers'
import { defineConfig } from '@foadonis/shopkeeper'
import type { ShopkeeperConfig } from '@foadonis/shopkeeper/types'

type CustomerModelImport = ShopkeeperConfig['models']['customerModel']

/**
 * Stripe keys are entered on the admin Payments page and stored encrypted
 * in `payment_methods`. `StripeGatewayService` swaps them in before every
 * Stripe call, so the values here are only boot-time placeholders.
 */
export default defineConfig({
  key: new Secret('pk_not_configured'),
  secret: new Secret('sk_not_configured'),

  currency: 'NZD',
  currencyLocale: 'en-NZ',

  webhook: {
    tolerance: 300,
    enforceSecret: false,
  },

  models: {
    customerModel: (() => import('#models/customer')) as unknown as CustomerModelImport,
    subscriptionModel: () => import('@foadonis/shopkeeper/models/subscription'),
    subscriptionItemModel: () => import('@foadonis/shopkeeper/models/subscription_item'),
  },

  calculateTaxes: false,

  keepIncompleteSubscriptionsActive: false,
  keepPastDueSubscriptionsActive: false,

  registerRoutes: false,
})
