import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { ThemePreset } from '#constants/storefront'

/**
 * Storefront colors. The table holds a single row.
 */
export default class StorefrontTheme extends BaseAppModel {
  static auditLabelFor() {
    return 'Storefront theme'
  }

  @column()
  declare preset: ThemePreset

  @column()
  declare primaryColor: string

  @column()
  declare primaryForegroundColor: string

  @column()
  declare accentColor: string

  @column()
  declare backgroundColor: string

  @column()
  declare surfaceColor: string

  @column()
  declare textColor: string

  /** Name shown next to the logo. Falls back to the store name when empty. */
  @column()
  declare brandName: string | null

  /** Drive key of the header logo. */
  @column()
  declare logoImage: string | null

  /** Drive prefix holding every generated favicon size. */
  @column()
  declare faviconFolder: string | null

  /** Bar above the header. Hidden when empty. */
  @column()
  declare announcementText: string | null

  @column()
  declare announcementUrl: string | null

  /** Footer text under the brand name. The storefront uses a default when empty. */
  @column()
  declare footerTagline: string | null
}
