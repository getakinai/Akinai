import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StoreSettingService from '#services/store_setting_service'
import StoreSettingTransformer from '#transformers/store_setting_transformer'
import { adminStoreSettingsAddressUpdateValidator } from '#validators/admin_store_settings_address_update_validator'

@inject()
export default class AdminStoreSettingsAddressUpdateController {
  constructor(protected storeSettingService: StoreSettingService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminStoreSettingsAddressUpdateValidator)
    const settings = await this.storeSettingService.updateAddress(payload)
    return ctx.serialize(StoreSettingTransformer.transform(settings))
  }
}
