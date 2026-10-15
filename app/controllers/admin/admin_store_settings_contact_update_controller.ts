import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StoreSettingService from '#services/store_setting_service'
import StoreSettingTransformer from '#transformers/store_setting_transformer'
import { adminStoreSettingsContactUpdateValidator } from '#validators/admin_store_settings_contact_update_validator'

@inject()
export default class AdminStoreSettingsContactUpdateController {
  constructor(protected storeSettingService: StoreSettingService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminStoreSettingsContactUpdateValidator)
    const settings = await this.storeSettingService.updateContact(payload)
    return ctx.serialize(StoreSettingTransformer.transform(settings))
  }
}
