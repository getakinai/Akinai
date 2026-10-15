import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionService from '#services/collection_service'
import CollectionTransformer from '#transformers/collection_transformer'

@inject()
export default class AdminCollectionsViewController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const collection = await this.collectionService.findDetail(ctx.params.id)
    return ctx.serialize(CollectionTransformer.transform(collection))
  }
}
