import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerSegmentService from '#services/customer_segment_service'
import CustomerSegmentTransformer from '#transformers/customer_segment_transformer'
import { adminCustomerSegmentUpdateValidator } from '#validators/admin_customer_segment_update_validator'

@inject()
export default class AdminCustomerSegmentsUpdateController {
  constructor(protected customerSegmentService: CustomerSegmentService) {}

  async handle(ctx: HttpContext) {
    const segment = await this.customerSegmentService.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(adminCustomerSegmentUpdateValidator, {
      meta: { segmentId: segment.id },
    })
    const updated = await this.customerSegmentService.update(segment, payload)

    return ctx.serialize(CustomerSegmentTransformer.transform(updated))
  }
}
