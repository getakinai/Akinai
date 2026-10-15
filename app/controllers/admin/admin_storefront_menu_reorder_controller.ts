import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMenuService from '#services/storefront_menu_service'
import { adminStorefrontMenuReorderValidator } from '#validators/admin_storefront_menu_reorder_validator'

@inject()
export default class AdminStorefrontMenuReorderController {
  constructor(protected storefrontMenuService: StorefrontMenuService) {}

  async handle(ctx: HttpContext) {
    const { ids } = await ctx.request.validateUsing(adminStorefrontMenuReorderValidator)
    await this.storefrontMenuService.reorder(ids)
    return ctx.response.noContent()
  }
}
