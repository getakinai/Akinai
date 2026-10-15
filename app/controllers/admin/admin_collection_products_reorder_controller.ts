import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionPolicy from '#policies/collection_policy'
import CollectionService from '#services/collection_service'
import { adminCollectionProductsReorderValidator } from '#validators/admin_collection_products_reorder_validator'

@inject()
export default class AdminCollectionProductsReorderController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const collection = await this.collectionService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CollectionPolicy).authorize('reorderProducts', collection)

    const { productId, position } = await ctx.request.validateUsing(
      adminCollectionProductsReorderValidator
    )
    await this.collectionService.moveProduct(collection, productId, position)

    return ctx.response.noContent()
  }
}
