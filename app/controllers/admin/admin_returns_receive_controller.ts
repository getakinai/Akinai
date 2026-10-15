import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ReturnPolicy from '#policies/return_policy'
import ReturnService from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'
import { adminReturnReceiveValidator } from '#validators/admin_return_receive_validator'

@inject()
export default class AdminReturnsReceiveController {
  constructor(protected returnService: ReturnService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminReturnReceiveValidator)
    const ret = await this.returnService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ReturnPolicy).authorize('receive', ret)

    const updated = await this.returnService.receive(
      ret,
      payload.lines.map((line) => ({ ...line, locationId: line.locationId ?? null }))
    )
    return ctx.serialize(ReturnTransformer.transform(updated))
  }
}
