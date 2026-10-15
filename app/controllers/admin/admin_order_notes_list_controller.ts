import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import OrderNoteService from '#services/order_note_service'
import OrderNoteTransformer from '#transformers/order_note_transformer'

@inject()
export default class AdminOrderNotesListController {
  constructor(
    protected orderService: OrderService,
    protected orderNoteService: OrderNoteService
  ) {}

  async handle(ctx: HttpContext) {
    const order = await this.orderService.findOrFail(ctx.params.id)
    if (order.isDraft) {
      return ctx.serialize(OrderNoteTransformer.transform([]))
    }
    const notes = await this.orderNoteService.listForAdmin(order.id)
    return ctx.serialize(OrderNoteTransformer.transform(notes))
  }
}
