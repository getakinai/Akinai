import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionPolicy from '#policies/collection_policy'
import CollectionService from '#services/collection_service'
import CollectionTransformer from '#transformers/collection_transformer'

@inject()
export default class AdminCollectionImageDeleteController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const collection = await this.collectionService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CollectionPolicy).authorize('update', collection)

    await this.collectionService.removeImage(collection)
    const detail = await this.collectionService.findDetail(collection.id)

    return ctx.serialize(CollectionTransformer.transform(detail))
  }
}
