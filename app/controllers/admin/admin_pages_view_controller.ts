import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PageService from '#services/page_service'
import PageTransformer from '#transformers/page_transformer'

@inject()
export default class AdminPagesViewController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const page = await this.pageService.findOrFail(ctx.params.id)
    return ctx.serialize(PageTransformer.transform(page))
  }
}
