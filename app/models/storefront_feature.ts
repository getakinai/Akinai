import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'
import type { FeatureIcon } from '#constants/storefront'

/**
 * A "Why shop with us" tile on the storefront home page, ordered by
 * `position`.
 */
export default class StorefrontFeature extends BaseAppModel {
  @column()
  declare icon: FeatureIcon

  @column()
  declare title: string

  @column()
  declare text: string

  @column()
  declare position: number
}
