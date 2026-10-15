import type { PluginManifest } from '#constants/plugins'

const manifest = {
  key: 'hero_slideshow',
  name: 'Hero slideshow',
  description:
    'A rotating banner at the top of the home page. Each slide links to a collection, page or URL.',
  category: 'storefront',
  slots: ['home.hero'],
  appBlocks: [{ type: 'hero', name: 'Hero slideshow' }],
  defaultInstalled: true,
  adminRoute: 'admin.storefront_theme.home',
} as const satisfies PluginManifest

export default manifest
