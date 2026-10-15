import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMenuService from '#services/storefront_menu_service'
import StorefrontMenuItemTransformer from '#transformers/storefront_menu_item_transformer'
import { adminStorefrontMenuItemStoreValidator } from '#validators/admin_storefront_menu_item_store_validator'

@inject()
export default class AdminStorefrontMenuStoreController {
  constructor(protected storefrontMenuService: StorefrontMenuService) {}

  async handle(ctx: HttpContext) {
    const { label, type, collectionId, pageId, url, isVisible } = await ctx.request.validateUsing(
      adminStorefrontMenuItemStoreValidator
    )
    const item = await this.storefrontMenuService.create({
      label,
      type,
      collectionId,
      pageId,
      url,
      isVisible,
    })

    ctx.response.status(201)
    return ctx.serialize(StorefrontMenuItemTransformer.transform(item))
  }
}
