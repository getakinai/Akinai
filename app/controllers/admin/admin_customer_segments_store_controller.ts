import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerSegmentService from '#services/customer_segment_service'
import CustomerSegmentTransformer from '#transformers/customer_segment_transformer'
import { adminCustomerSegmentStoreValidator } from '#validators/admin_customer_segment_store_validator'

@inject()
export default class AdminCustomerSegmentsStoreController {
  constructor(protected customerSegmentService: CustomerSegmentService) {}

  async handle(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(adminCustomerSegmentStoreValidator)
    const segment = await this.customerSegmentService.create(payload)

    ctx.response.status(201)
    return ctx.serialize(CustomerSegmentTransformer.transform(segment))
  }
}
