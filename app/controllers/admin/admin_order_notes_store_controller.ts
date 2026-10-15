import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderPolicy from '#policies/order_policy'
import OrderService from '#services/order_service'
import OrderNoteService from '#services/order_note_service'
import OrderNoteTransformer from '#transformers/order_note_transformer'
import { adminOrderNoteStoreValidator } from '#validators/admin_order_note_store_validator'

@inject()
export default class AdminOrderNotesStoreController {
  constructor(
    protected orderService: OrderService,
    protected orderNoteService: OrderNoteService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OrderPolicy).authorize('addNote', order)

    const payload = await ctx.request.validateUsing(adminOrderNoteStoreValidator)
    const user = ctx.auth.use('web').getUserOrFail()
    const note = await this.orderNoteService.create(order, user.id, payload)

    return ctx.serialize(OrderNoteTransformer.transform(note))
  }
}
