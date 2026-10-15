import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ReturnPolicy from '#policies/return_policy'
import ReturnService from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'
import { adminReturnApproveValidator } from '#validators/admin_return_approve_validator'

@inject()
export default class AdminReturnsApproveController {
  constructor(protected returnService: ReturnService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminReturnApproveValidator)
    const ret = await this.returnService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ReturnPolicy).authorize('approve', ret)

    const updated = await this.returnService.approve(ret, payload)
    return ctx.serialize(ReturnTransformer.transform(updated))
  }
}
