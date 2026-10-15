import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StoreSettingService from '#services/store_setting_service'
import StoreSettingTransformer from '#transformers/store_setting_transformer'
import { adminStoreSettingsCheckoutUpdateValidator } from '#validators/admin_store_settings_checkout_update_validator'

@inject()
export default class AdminStoreSettingsCheckoutUpdateController {
  constructor(protected storeSettingService: StoreSettingService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminStoreSettingsCheckoutUpdateValidator)
    const settings = await this.storeSettingService.updateCheckout({
      checkoutDeliveryHeading: payload.checkoutDeliveryHeading || null,
      checkoutDeliveryNote: payload.checkoutDeliveryNote || null,
    })
    return ctx.serialize(StoreSettingTransformer.transform(settings))
  }
}
