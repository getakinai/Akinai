import type { PluginManifest } from '#constants/plugins'

const manifest = {
  key: 'newsletter',
  name: 'Newsletter',
  description:
    'A signup form at the top of the storefront footer and on the maintenance page. Matching customers are opted in to marketing.',
  category: 'marketing',
  slots: ['layout.footer'],
  defaultInstalled: true,
  adminRoute: 'admin.newsletter_subscribers.home',
  adminPermission: 'newsletter_subscribers.view',
} as const satisfies PluginManifest

export default manifest
