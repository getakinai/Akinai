import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticlePolicy from '#policies/help_article_policy'
import HelpArticleService from '#services/help_article_service'
import AdminHelpArticleTransformer from '#transformers/admin_help_article_transformer'

@inject()
export default class AdminHelpArticlesArchiveController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const article = await this.helpArticleService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(HelpArticlePolicy).authorize('archive', article)

    const updated = await this.helpArticleService.archive(article)
    return ctx.serialize(AdminHelpArticleTransformer.transform(updated))
  }
}
