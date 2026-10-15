import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CustomerSegmentService from '#services/customer_segment_service'

@inject()
export default class AdminCustomerSegmentsDeleteController {
  constructor(protected customerSegmentService: CustomerSegmentService) {}

  async handle(ctx: HttpContext) {
    const segment = await this.customerSegmentService.findOrFail(ctx.params.id)
    await this.customerSegmentService.delete(segment)
    return ctx.response.noContent()
  }
}
