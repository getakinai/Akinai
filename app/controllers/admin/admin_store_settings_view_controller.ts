import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StoreSettingService from '#services/store_setting_service'
import StoreSettingTransformer from '#transformers/store_setting_transformer'

@inject()
export default class AdminStoreSettingsViewController {
  constructor(protected storeSettingService: StoreSettingService) {}

  async handle(ctx: HttpContext) {
    const settings = await this.storeSettingService.get()
    return ctx.serialize(StoreSettingTransformer.transform(settings))
  }
}
