import type { PluginManifest } from '#constants/plugins'

const manifest = {
  key: 'hero_slideshow',
  name: 'Hero slideshow',
  description:
    'A rotating banner at the top of the home page. Each slide links to a collection, page or URL.',
  category: 'storefront',
  slots: ['home.hero'],
  defaultInstalled: true,
  adminRoute: 'admin.storefront_hero.home',
} as const satisfies PluginManifest

export default manifest
