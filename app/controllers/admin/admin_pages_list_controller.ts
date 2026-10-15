import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PageService from '#services/page_service'
import PageTransformer from '#transformers/page_transformer'
import { adminPagesListQueryValidator } from '#validators/admin_pages_list_query_validator'

@inject()
export default class AdminPagesListController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminPagesListQueryValidator,
      { data: ctx.request.qs() }
    )
    const pages = await this.pageService.paginate({ q, status, sort, direction, page, perPage })

    return ctx.serialize(
      PageTransformer.paginate(pages.all(), pages.getMeta()).useVariant('toListItem')
    )
  }
}
