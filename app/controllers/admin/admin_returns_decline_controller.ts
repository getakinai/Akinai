import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ReturnPolicy from '#policies/return_policy'
import ReturnService from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'
import { adminReturnDeclineValidator } from '#validators/admin_return_decline_validator'

@inject()
export default class AdminReturnsDeclineController {
  constructor(protected returnService: ReturnService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminReturnDeclineValidator)
    const ret = await this.returnService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ReturnPolicy).authorize('decline', ret)

    const updated = await this.returnService.decline(ret, payload)
    return ctx.serialize(ReturnTransformer.transform(updated))
  }
}
