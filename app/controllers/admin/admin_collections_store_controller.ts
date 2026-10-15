import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionService from '#services/collection_service'
import CollectionTransformer from '#transformers/collection_transformer'
import { adminCollectionStoreValidator } from '#validators/admin_collection_store_validator'

@inject()
export default class AdminCollectionsStoreController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const {
      title,
      description,
      type,
      status,
      match,
      sortOrder,
      slug,
      seoTitle,
      seoDescription,
      rules,
    } = await ctx.request.validateUsing(adminCollectionStoreValidator)

    const collection = await this.collectionService.create({
      title,
      description,
      type,
      status,
      match,
      sortOrder,
      slug,
      seoTitle,
      seoDescription,
      rules,
    })
    const detail = await this.collectionService.findDetail(collection.id)

    ctx.response.status(201)
    return ctx.serialize(CollectionTransformer.transform(detail))
  }
}
