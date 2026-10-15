import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpArticlePolicy from '#policies/help_article_policy'
import HelpArticleService from '#services/help_article_service'
import AdminHelpArticleTransformer from '#transformers/admin_help_article_transformer'

@inject()
export default class AdminHelpArticlesUnarchiveController {
  constructor(protected helpArticleService: HelpArticleService) {}

  async handle(ctx: HttpContext) {
    const article = await this.helpArticleService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(HelpArticlePolicy).authorize('unarchive', article)

    const updated = await this.helpArticleService.unarchive(article)
    return ctx.serialize(AdminHelpArticleTransformer.transform(updated))
  }
}
