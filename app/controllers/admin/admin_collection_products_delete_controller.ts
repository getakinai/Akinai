import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionPolicy from '#policies/collection_policy'
import CollectionService from '#services/collection_service'
import { adminCollectionProductParamsValidator } from '#validators/admin_collection_product_params_validator'

@inject()
export default class AdminCollectionProductsDeleteController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const { params } = await ctx.request.validateUsing(adminCollectionProductParamsValidator)
    const collection = await this.collectionService.findOrFail(params.collectionId)
    await ctx.bouncer.with(CollectionPolicy).authorize('editProducts', collection)

    await this.collectionService.removeProduct(collection, ctx.params.id)

    return ctx.response.noContent()
  }
}
