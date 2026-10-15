import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { ThemeTemplateData } from '#constants/themes'

/**
 * A JSON template of one theme (`index`, `product`, `page.contact`, …): the
 * sections the page shows and their settings. The storefront reads `data`;
 * the theme editor writes `draftData` until staff save.
 */
export default class ThemeTemplate extends BaseAppModel {
  static auditLabelFor(attributes: Record<string, unknown>) {
    return typeof attributes.name === 'string' ? `Theme template ${attributes.name}` : null
  }

  @column()
  declare themeId: string

  @column()
  declare name: string

  @column({ prepare: (value: ThemeTemplateData) => JSON.stringify(value) })
  declare data: ThemeTemplateData

  @column({
    prepare: (value: ThemeTemplateData | null) => (value ? JSON.stringify(value) : null),
  })
  declare draftData: ThemeTemplateData | null
}
