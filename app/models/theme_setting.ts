import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { ThemeSettingsData } from '#constants/themes'

/**
 * Theme settings and static sections of one theme. The storefront reads
 * `data`; the theme editor writes `draftData` until staff save.
 */
export default class ThemeSetting extends BaseAppModel {
  static auditLabelFor() {
    return 'Theme settings'
  }

  @column()
  declare themeId: string

  @column({ prepare: (value: ThemeSettingsData) => JSON.stringify(value) })
  declare data: ThemeSettingsData

  @column({
    prepare: (value: ThemeSettingsData | null) => (value ? JSON.stringify(value) : null),
  })
  declare draftData: ThemeSettingsData | null
}
