import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionService from '#services/collection_service'
import ProductTransformer from '#transformers/product_transformer'
import { adminCollectionPreviewValidator } from '#validators/admin_collection_preview_validator'

@inject()
export default class AdminCollectionsPreviewController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const { match, sortOrder, rules } = await ctx.request.validateUsing(
      adminCollectionPreviewValidator
    )
    const products = await this.collectionService.preview({ match, sortOrder, rules })

    return ctx.serialize(ProductTransformer.paginate(products.all(), products.getMeta()))
  }
}
