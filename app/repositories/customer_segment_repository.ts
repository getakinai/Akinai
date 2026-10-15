import CustomerSegment from '#models/customer_segment'
import { MAX_CUSTOMER_SEGMENTS, type CustomerSegmentFilters } from '#constants/customer_marketing'

export type CustomerSegmentData = { name: string; filters: CustomerSegmentFilters }

export default class CustomerSegmentRepository {
  async list(): Promise<CustomerSegment[]> {
    return CustomerSegment.query().orderBy('name', 'asc').limit(MAX_CUSTOMER_SEGMENTS)
  }

  async count(): Promise<number> {
    const [row] = await CustomerSegment.query().count('* as total')
    return Number(row.$extras.total)
  }

  async findOrFail(id: string): Promise<CustomerSegment> {
    return CustomerSegment.findOrFail(id)
  }

  async create(data: CustomerSegmentData): Promise<CustomerSegment> {
    return CustomerSegment.create(data)
  }

  async update(segment: CustomerSegment, data: CustomerSegmentData): Promise<CustomerSegment> {
    return segment.merge(data).save()
  }

  async delete(segment: CustomerSegment): Promise<void> {
    await segment.delete()
  }
}
