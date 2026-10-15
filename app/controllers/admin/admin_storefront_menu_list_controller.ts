import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMenuService from '#services/storefront_menu_service'
import StorefrontMenuItemTransformer from '#transformers/storefront_menu_item_transformer'

@inject()
export default class AdminStorefrontMenuListController {
  constructor(protected storefrontMenuService: StorefrontMenuService) {}

  async handle(ctx: HttpContext) {
    const items = await this.storefrontMenuService.list()
    return ctx.serialize(StorefrontMenuItemTransformer.transform(items))
  }
}
