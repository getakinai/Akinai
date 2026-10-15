import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PageService from '#services/page_service'
import BulkResultTransformer from '#transformers/bulk_result_transformer'
import { adminBulkStatusValidator } from '#validators/admin_bulk_status_validator'

@inject()
export default class AdminPagesBulkStatusController {
  constructor(protected pageService: PageService) {}

  async handle(ctx: HttpContext) {
    const { ids, status } = await ctx.request.validateUsing(adminBulkStatusValidator)
    const result = await this.pageService.bulkSetStatus(ids, status)
    return ctx.serialize(BulkResultTransformer.transform(result))
  }
}
