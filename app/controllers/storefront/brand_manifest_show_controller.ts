import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { MANIFEST_ICON_FILES } from '#constants/branding'
import StoreSettingService from '#services/store_setting_service'
import StorefrontThemeService from '#services/storefront_theme_service'

/**
 * Web app manifest. Browsers read this exact shape, so it is not wrapped in
 * `{ data }`.
 */
@inject()
export default class BrandManifestShowController {
  constructor(
    protected storeSettingService: StoreSettingService,
    protected storefrontThemeService: StorefrontThemeService
  ) {}

  async handle({ response }: HttpContext) {
    const [settings, theme] = await Promise.all([
      this.storeSettingService.get(),
      this.storefrontThemeService.get(),
    ])

    const appName = theme.brandName || settings.storeName

    response.header('Content-Type', 'application/manifest+json')
    response.header('Cache-Control', 'public, max-age=300')
    return {
      name: appName,
      short_name: appName,
      start_url: '/',
      display: 'standalone',
      theme_color: theme.primaryColor,
      background_color: theme.backgroundColor,
      icons: MANIFEST_ICON_FILES.map(({ name, size }) => ({
        src: `/brand/favicons/${name}`,
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
    }
  }
}
