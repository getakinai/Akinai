import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerService from '#services/customer_service'
import OrderService from '#services/order_service'
import ReturnService from '#services/return_service'
import ReturnTransformer from '#transformers/return_transformer'
import { customersOrderReturnStoreValidator } from '#validators/customers_order_return_store_validator'

@inject()
export default class CustomersAccountOrderReturnsStoreController {
  constructor(
    protected customerService: CustomerService,
    protected orderService: OrderService,
    protected returnService: ReturnService
  ) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(customersOrderReturnStoreValidator)
    const customer = await this.customerService.profileFor(ctx.auth.use('customer').getUserOrFail())
    const order = await this.orderService.findForCustomerOrFail(customer.id, ctx.params.id)

    const created = await this.returnService.requestByCustomer(order, customer.id, {
      note: payload.note ?? null,
      lines: payload.lines.map((line) => ({ ...line, note: line.note ?? null })),
    })
    return ctx.serialize(ReturnTransformer.transform(created).useVariant('toCustomer'))
  }
}
