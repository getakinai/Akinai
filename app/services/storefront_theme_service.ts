import { inject } from '@adonisjs/core'
import type StorefrontTheme from '#models/storefront_theme'
import {
  DEFAULT_THEME_PRESET,
  THEME_PRESETS,
  type ThemeColors,
  type ThemePreset,
} from '#constants/storefront'
import StorefrontThemeRepository from '#repositories/storefront_theme_repository'

const COLOR_KEYS: (keyof ThemeColors)[] = [
  'primaryColor',
  'primaryForegroundColor',
  'accentColor',
  'backgroundColor',
  'surfaceColor',
  'textColor',
]

@inject()
export default class StorefrontThemeService {
  constructor(protected storefrontThemeRepository: StorefrontThemeRepository) {}

  async get(): Promise<StorefrontTheme> {
    return this.storefrontThemeRepository.firstOrCreate({
      preset: DEFAULT_THEME_PRESET,
      ...THEME_PRESETS[DEFAULT_THEME_PRESET],
    })
  }

  /**
   * Saves the colors and labels the theme with the preset they match, or
   * `custom` when they match none.
   */
  async update(data: ThemeColors): Promise<StorefrontTheme> {
    const colors = Object.fromEntries(
      COLOR_KEYS.map((key) => [key, data[key].toLowerCase()])
    ) as ThemeColors
    return this.storefrontThemeRepository.update(await this.get(), {
      preset: matchingPreset(colors),
      ...colors,
    })
  }

  /**
   * Announcement bar and footer tagline. Empty values clear them. The
   * announcement link is dropped when there is no announcement text.
   */
  async setContent(input: {
    announcementText?: string | null
    announcementUrl?: string | null
    footerTagline?: string | null
  }): Promise<StorefrontTheme> {
    const announcementText = input.announcementText || null
    return this.storefrontThemeRepository.update(await this.get(), {
      announcementText,
      announcementUrl: announcementText ? input.announcementUrl || null : null,
      footerTagline: input.footerTagline || null,
    })
  }
}

function matchingPreset(colors: ThemeColors): ThemePreset {
  for (const [key, preset] of Object.entries(THEME_PRESETS)) {
    if (COLOR_KEYS.every((color) => preset[color] === colors[color])) return key as ThemePreset
  }
  return 'custom'
}
