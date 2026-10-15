import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PagePolicy from '#policies/page_policy'
import PageService from '#services/page_service'
import PageTransformer from '#transformers/page_transformer'
import { adminPageUpdateValidator } from '#validators/admin_page_update_validator'

@inject()
export default class AdminPagesUpdateController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const page = await this.pageService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(PagePolicy).authorize('update', page)

    const { title, body, status, slug, seoTitle, seoDescription, policyType } =
      await ctx.request.validateUsing(adminPageUpdateValidator)

    const updated = await this.pageService.update(page, {
      title,
      body,
      status,
      slug,
      seoTitle,
      seoDescription,
      policyType,
    })

    return ctx.serialize(PageTransformer.transform(updated))
  }
}
