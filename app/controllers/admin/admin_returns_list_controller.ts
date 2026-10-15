import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ReturnService from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'
import { adminReturnsListQueryValidator } from '#validators/admin_returns_list_query_validator'

@inject()
export default class AdminReturnsListController {
  constructor(protected returnService: ReturnService) {}

  async handle(ctx: HttpContext) {
    const filters = await ctx.request.validateUsing(adminReturnsListQueryValidator, {
      data: ctx.request.qs(),
    })
    const returns = await this.returnService.paginate(filters)
    return ctx.serialize(
      ReturnTransformer.paginate(returns.all(), returns.getMeta()).useVariant('toListItem')
    )
  }
}
