import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMenuService from '#services/storefront_menu_service'
import StorefrontMenuItemTransformer from '#transformers/storefront_menu_item_transformer'
import { adminStorefrontMenuItemUpdateValidator } from '#validators/admin_storefront_menu_item_update_validator'

@inject()
export default class AdminStorefrontMenuUpdateController {
  constructor(protected storefrontMenuService: StorefrontMenuService) {}

  async handle(ctx: HttpContext) {
    const item = await this.storefrontMenuService.findOrFail(ctx.params.id)
    const { label, type, collectionId, pageId, url, isVisible } = await ctx.request.validateUsing(
      adminStorefrontMenuItemUpdateValidator
    )
    const updated = await this.storefrontMenuService.update(item, {
      label,
      type,
      collectionId,
      pageId,
      url,
      isVisible,
    })

    return ctx.serialize(StorefrontMenuItemTransformer.transform(updated))
  }
}
