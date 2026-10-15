import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionPolicy from '#policies/collection_policy'
import CollectionService from '#services/collection_service'
import { adminCollectionProductsStoreValidator } from '#validators/admin_collection_products_store_validator'

@inject()
export default class AdminCollectionProductsStoreController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const collection = await this.collectionService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CollectionPolicy).authorize('editProducts', collection)

    const { productIds } = await ctx.request.validateUsing(adminCollectionProductsStoreValidator)
    const added = await this.collectionService.addProducts(collection, productIds)

    return { data: { added } }
  }
}
