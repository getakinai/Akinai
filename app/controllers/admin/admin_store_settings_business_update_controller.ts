import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StoreSettingService from '#services/store_setting_service'
import StoreSettingTransformer from '#transformers/store_setting_transformer'
import { adminStoreSettingsBusinessUpdateValidator } from '#validators/admin_store_settings_business_update_validator'

@inject()
export default class AdminStoreSettingsBusinessUpdateController {
  constructor(protected storeSettingService: StoreSettingService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminStoreSettingsBusinessUpdateValidator)
    const settings = await this.storeSettingService.updateBusiness({
      ...payload,
      legalName: payload.legalName ?? null,
      ownerSuburb: payload.ownerSuburb ?? null,
      ownerRegion: payload.ownerRegion ?? null,
    })
    return ctx.serialize(StoreSettingTransformer.transform(settings))
  }
}
