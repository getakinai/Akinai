import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontMenuService from '#services/storefront_menu_service'
import StorefrontCollectionOptionTransformer from '#transformers/storefront_collection_option_transformer'

@inject()
export default class AdminStorefrontMenuCollectionsController {
  constructor(protected storefrontMenuService: StorefrontMenuService) {}

  async handle(ctx: HttpContext) {
    const collections = await this.storefrontMenuService.collectionOptions()
    return ctx.serialize(StorefrontCollectionOptionTransformer.transform(collections))
  }
}
