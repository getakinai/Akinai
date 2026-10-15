import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PageService from '#services/page_service'
import StorefrontPageTransformer from '#transformers/storefront_page_transformer'

@inject()
export default class StorefrontPoliciesListController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const pages = await this.pageService.policies()
    return ctx.serialize(StorefrontPageTransformer.transform(pages).useVariant('toPolicy'))
  }
}
