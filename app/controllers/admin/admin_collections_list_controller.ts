import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CollectionService from '#services/collection_service'
import CollectionTransformer from '#transformers/collection_transformer'
import { adminCollectionsListQueryValidator } from '#validators/admin_collections_list_query_validator'

@inject()
export default class AdminCollectionsListController {
  constructor(protected collectionService: CollectionService) {}

  async handle(ctx: HttpContext) {
    const { q, status, type, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminCollectionsListQueryValidator,
      { data: ctx.request.qs() }
    )
    const collections = await this.collectionService.paginate({
      q,
      status,
      type,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(CollectionTransformer.paginate(collections.all(), collections.getMeta()))
  }
}
