import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionPolicy from '#policies/collection_policy'
import CollectionService from '#services/collection_service'
import CollectionTransformer from '#transformers/collection_transformer'
import { adminCollectionUpdateValidator } from '#validators/admin_collection_update_validator'

@inject()
export default class AdminCollectionsUpdateController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const collection = await this.collectionService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CollectionPolicy).authorize('update', collection)

    const { title, description, status, match, sortOrder, slug, seoTitle, seoDescription, rules } =
      await ctx.request.validateUsing(adminCollectionUpdateValidator)

    await this.collectionService.update(collection, {
      title,
      description,
      status,
      match,
      sortOrder,
      slug,
      seoTitle,
      seoDescription,
      rules,
    })
    const detail = await this.collectionService.findDetail(collection.id)

    return ctx.serialize(CollectionTransformer.transform(detail))
  }
}
