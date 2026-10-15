import StorefrontTheme from '#models/storefront_theme'
import type { ThemeColors, ThemePreset } from '#constants/storefront'

export type StorefrontThemeData = ThemeColors & { preset: ThemePreset }

export type StorefrontBrandingData = {
  brandName?: string | null
  logoImage?: string | null
  faviconFolder?: string | null
}

export type StorefrontContentData = {
  announcementText: string | null
  announcementUrl: string | null
  footerTagline: string | null
}

export default class StorefrontThemeRepository {
  /**
   * Returns the single theme row, creating it from `defaults` when the table
   * is empty.
   */
  async firstOrCreate(defaults: StorefrontThemeData): Promise<StorefrontTheme> {
    const existing = await StorefrontTheme.query().orderBy('created_at', 'asc').first()
    if (existing) return existing
    return StorefrontTheme.create(defaults)
  }

  async update(
    theme: StorefrontTheme,
    changes: StorefrontThemeData | StorefrontBrandingData | StorefrontContentData
  ): Promise<StorefrontTheme> {
    theme.merge(changes)
    await theme.save()
    return theme
  }
}
