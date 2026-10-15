import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PageService from '#services/page_service'
import PageTransformer from '#transformers/page_transformer'
import { adminPageStoreValidator } from '#validators/admin_page_store_validator'

@inject()
export default class AdminPagesStoreController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const { title, body, status, slug, seoTitle, seoDescription, policyType } =
      await ctx.request.validateUsing(adminPageStoreValidator)

    const page = await this.pageService.create({
      title,
      body,
      status,
      slug,
      seoTitle,
      seoDescription,
      policyType,
    })

    ctx.response.status(201)
    return ctx.serialize(PageTransformer.transform(page))
  }
}
