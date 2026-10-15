import { BaseTransformer } from '@adonisjs/core/transformers'
import type CustomerSegment from '#models/customer_segment'

export default class CustomerSegmentTransformer extends BaseTransformer<CustomerSegment> {
  toObject() {
    const { filters } = this.resource
    return {
      ...this.pick(this.resource, ['id', 'name', 'createdAt', 'updatedAt']),
      filters: {
        tags: filters.tags ?? [],
        marketing: filters.marketing ?? null,
        countryCode: filters.countryCode ?? null,
        ordersMin: filters.ordersMin ?? null,
        ordersMax: filters.ordersMax ?? null,
        spentCurrency: filters.spentCurrency ?? null,
        spentMin: filters.spentMin ?? null,
        spentMax: filters.spentMax ?? null,
        lastOrderFrom: filters.lastOrderFrom ?? null,
        lastOrderTo: filters.lastOrderTo ?? null,
      },
    }
  }
}
