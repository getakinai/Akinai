import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontHomeContentService from '#services/storefront_home_content_service'
import StorefrontHomeContentTransformer from '#transformers/storefront_home_content_transformer'

@inject()
export default class StorefrontHomeContentViewController {
  constructor(protected storefrontHomeContentService: StorefrontHomeContentService) {}

  async handle(ctx: HttpContext) {
    const content = await this.storefrontHomeContentService.get()
    return ctx.serialize(StorefrontHomeContentTransformer.transform(content).depth(2))
  }
}
