import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'

/** Draft overrides for theme package files while staff customize in the editor. */
export default class ThemeSourceDraft extends BaseAppModel {
  @column()
  declare themeId: string

  @column()
  declare path: string

  @column()
  declare content: string
}
