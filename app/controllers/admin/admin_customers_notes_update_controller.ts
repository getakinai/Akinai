import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerPolicy from '#policies/customer_policy'
import CustomerService from '#services/customer_service'
import CustomerTransformer from '#transformers/customer_transformer'
import { adminCustomerNotesUpdateValidator } from '#validators/admin_customer_notes_update_validator'

@inject()
export default class AdminCustomersNotesUpdateController {
  constructor(protected customerService: CustomerService) {}

  async handle(ctx: HttpContext) {
    const customer = await this.customerService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(CustomerPolicy).authorize('update', customer)

    const { tags, note } = await ctx.request.validateUsing(adminCustomerNotesUpdateValidator)
    const detail = await this.customerService.updateTagsAndNote(customer, tags, note || null)

    return ctx.serialize(CustomerTransformer.transform(detail).useVariant('toDetail'))
  }
}
