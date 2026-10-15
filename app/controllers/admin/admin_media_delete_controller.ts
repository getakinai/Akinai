import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import MediaPolicy from '#policies/media_policy'
import MediaService, { MediaInUseError } from '#services/media_service'

@inject()
export default class AdminMediaDeleteController {
  constructor(protected mediaService: MediaService) {}

  async handle(ctx: HttpContext) {
    await ctx.bouncer.with(MediaPolicy).authorize('delete')
    const media = await this.mediaService.findOrFail(ctx.params.id)

    try {
      await this.mediaService.delete(media)
    } catch (error) {
      if (!(error instanceof MediaInUseError)) throw error
      const places = error.usages.map(({ label }) => label).join(', ')
      return ctx.response.status(422).json({
        errors: [{ message: `This image is used in ${places}. Replace it there first.` }],
        usages: error.usages,
      })
    }

    return ctx.response.noContent()
  }
}
