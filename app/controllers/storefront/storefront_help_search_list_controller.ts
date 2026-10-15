import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCenterService from '#services/help_center_service'
import HelpSearchResultTransformer from '#transformers/help_search_result_transformer'
import { storefrontHelpSearchQueryValidator } from '#validators/storefront_help_search_query_validator'

@inject()
export default class StorefrontHelpSearchListController {
  constructor(protected helpCenterService: HelpCenterService) {}

  async handle(ctx: HttpContext) {
    const { q } = await ctx.request.validateUsing(storefrontHelpSearchQueryValidator, {
      data: ctx.request.qs(),
    })
    const results = await this.helpCenterService.search(q)
    return ctx.serialize(HelpSearchResultTransformer.transform(results))
  }
}
