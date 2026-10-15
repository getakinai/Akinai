import type { PluginManifest } from '#constants/plugins'

const manifest = {
  key: 'bank_transfer',
  name: 'Bank transfer',
  description:
    'Customers pay by bank deposit into your account. Set up an account for each market; orders wait for payment until you mark them paid.',
  category: 'payments',
  slots: [],
  defaultInstalled: true,
  adminRoute: 'admin.payments.home',
} as const satisfies PluginManifest

export default manifest
