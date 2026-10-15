import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PageService from '#services/page_service'
import PageTransformer from '#transformers/page_transformer'

@inject()
export default class AdminStorefrontMenuPagesController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const pages = await this.pageService.linkable()
    return ctx.serialize(PageTransformer.transform(pages).useVariant('toOption'))
  }
}
