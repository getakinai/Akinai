import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMenuService from '#services/storefront_menu_service'

@inject()
export default class AdminStorefrontMenuDeleteController {
  constructor(protected storefrontMenuService: StorefrontMenuService) {}

  async handle(ctx: HttpContext) {
    const item = await this.storefrontMenuService.findOrFail(ctx.params.id)
    await this.storefrontMenuService.delete(item)
    return ctx.response.noContent()
  }
}
