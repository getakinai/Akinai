import type { PluginManifest } from '#constants/plugins'

const manifest = {
  key: 'stripe',
  name: 'Stripe',
  description:
    'Accept credit and debit cards through Stripe Checkout. Payments are confirmed automatically and can be refunded from the order.',
  category: 'payments',
  slots: [],
  defaultInstalled: true,
  adminRoute: 'admin.payments.home',
} as const satisfies PluginManifest

export default manifest
