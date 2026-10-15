import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerSegmentService from '#services/customer_segment_service'
import CustomerSegmentTransformer from '#transformers/customer_segment_transformer'

@inject()
export default class AdminCustomerSegmentsListController {
  constructor(protected customerSegmentService: CustomerSegmentService) {}

  async handle(ctx: HttpContext) {
    const segments = await this.customerSegmentService.list()
    return ctx.serialize(CustomerSegmentTransformer.transform(segments))
  }
}
