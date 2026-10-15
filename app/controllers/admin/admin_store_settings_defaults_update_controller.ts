import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StoreSettingService from '#services/store_setting_service'
import StoreSettingTransformer from '#transformers/store_setting_transformer'
import { adminStoreSettingsDefaultsUpdateValidator } from '#validators/admin_store_settings_defaults_update_validator'

@inject()
export default class AdminStoreSettingsDefaultsUpdateController {
  constructor(protected storeSettingService: StoreSettingService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminStoreSettingsDefaultsUpdateValidator)
    const settings = await this.storeSettingService.updateDefaults(payload)
    return ctx.serialize(StoreSettingTransformer.transform(settings))
  }
}
