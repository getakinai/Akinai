import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PagePolicy from '#policies/page_policy'
import PageService from '#services/page_service'
import PageTransformer from '#transformers/page_transformer'

@inject()
export default class AdminPagesUnarchiveController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const page = await this.pageService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(PagePolicy).authorize('unarchive', page)

    const updated = await this.pageService.unarchive(page)
    return ctx.serialize(PageTransformer.transform(updated))
  }
}
