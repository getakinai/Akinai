import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MediaService from '#services/media_service'
import { adminMediaStoreValidator } from '#validators/admin_media_store_validator'

@inject()
export default class AdminMediaStoreController {
  constructor(protected mediaService: MediaService) {}

  async handle(ctx: HttpContext) {
    const { images } = await ctx.request.validateUsing(adminMediaStoreValidator)
    const keys = await this.mediaService.upload(images)

    return ctx.response.created({ data: { count: keys.length } })
  }
}
