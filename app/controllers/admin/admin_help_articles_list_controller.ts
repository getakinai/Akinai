import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticleService from '#services/help_article_service'
import AdminHelpArticleTransformer from '#transformers/admin_help_article_transformer'
import { adminHelpArticlesListQueryValidator } from '#validators/admin_help_articles_list_query_validator'

@inject()
export default class AdminHelpArticlesListController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const { q, status, categoryId, sort, direction, page, perPage } =
      await ctx.request.validateUsing(adminHelpArticlesListQueryValidator, {
        data: ctx.request.qs(),
      })
    const articles = await this.helpArticleService.paginate({
      q,
      status,
      categoryId,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(
      AdminHelpArticleTransformer.paginate(articles.all(), articles.getMeta()).useVariant(
        'toListItem'
      )
    )
  }
}
