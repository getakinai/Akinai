import type { PluginManifest } from '#constants/plugins'

const manifest = {
  key: 'poli',
  name: 'POLi',
  description:
    'Customers in New Zealand and Australia pay straight from their online banking. Available in NZD and AUD markets.',
  category: 'payments',
  slots: [],
  defaultInstalled: true,
  adminRoute: 'admin.payments.home',
} as const satisfies PluginManifest

export default manifest
