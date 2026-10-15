import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ReturnPolicy from '#policies/return_policy'
import ReturnService from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'

@inject()
export default class AdminReturnsCancelController {
  constructor(protected returnService: ReturnService) {}

  async handle(ctx: HttpContext) {
    const ret = await this.returnService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(ReturnPolicy).authorize('cancel', ret)

    const updated = await this.returnService.cancel(ret)
    return ctx.serialize(ReturnTransformer.transform(updated))
  }
}
