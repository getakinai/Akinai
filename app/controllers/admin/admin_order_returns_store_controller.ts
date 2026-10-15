import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderService from '#services/order_service'
import ReturnService from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'
import { adminReturnStoreValidator } from '#validators/admin_return_store_validator'

@inject()
export default class AdminOrderReturnsStoreController {
  constructor(
    protected orderService: OrderService,
    protected returnService: ReturnService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminReturnStoreValidator)
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('createReturn', order)

    const created = await this.returnService.createByStaff(order, {
      note: payload.note ?? null,
      lines: payload.lines.map((line) => ({ ...line, note: line.note ?? null })),
    })
    return ctx.serialize(ReturnTransformer.transform(created))
  }
}
