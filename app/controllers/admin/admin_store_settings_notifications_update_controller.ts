import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StoreSettingService from '#services/store_setting_service'
import StoreSettingTransformer from '#transformers/store_setting_transformer'
import { adminStoreSettingsNotificationsUpdateValidator } from '#validators/admin_store_settings_notifications_update_validator'

@inject()
export default class AdminStoreSettingsNotificationsUpdateController {
  constructor(protected storeSettingService: StoreSettingService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminStoreSettingsNotificationsUpdateValidator)
    const settings = await this.storeSettingService.updateNotifications(payload)
    return ctx.serialize(StoreSettingTransformer.transform(settings))
  }
}
