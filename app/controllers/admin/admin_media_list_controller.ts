import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MediaService from '#services/media_service'
import MediaTransformer from '#transformers/media_transformer'
import { adminMediaListQueryValidator } from '#validators/admin_media_list_query_validator'

@inject()
export default class AdminMediaListController {
  constructor(protected mediaService: MediaService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminMediaListQueryValidator, {
      data: ctx.request.qs(),
    })
    const media = await this.mediaService.paginate(filters)

    return ctx.serialize(MediaTransformer.paginate(media.all(), media.getMeta()))
  }
}
