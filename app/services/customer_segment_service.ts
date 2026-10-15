import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import type CustomerSegment from '#models/customer_segment'
import CustomerSegmentRepository, {
  type CustomerSegmentData,
} from '#repositories/customer_segment_repository'
import { MAX_CUSTOMER_SEGMENTS, type CustomerSegmentFilters } from '#constants/customer_marketing'

/** Drops empty values so a saved segment only holds the filters in use. */
function compactFilters(filters: CustomerSegmentFilters): CustomerSegmentFilters {
  const entries = Object.entries(filters).filter(([, value]) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null
  )
  return Object.fromEntries(entries) as CustomerSegmentFilters
}

@inject()
export default class CustomerSegmentService {
  constructor(protected customerSegmentRepository: CustomerSegmentRepository) {}

  async list(): Promise<CustomerSegment[]> {
    return this.customerSegmentRepository.list()
  }

  async findOrFail(id: string): Promise<CustomerSegment> {
    return this.customerSegmentRepository.findOrFail(id)
  }

  async create(data: CustomerSegmentData): Promise<CustomerSegment> {
    if ((await this.customerSegmentRepository.count()) >= MAX_CUSTOMER_SEGMENTS) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'name',
          message: `You can save up to ${MAX_CUSTOMER_SEGMENTS} segments. Delete one first.`,
          rule: 'max',
        },
      ])
    }
    return this.customerSegmentRepository.create({
      name: data.name,
      filters: compactFilters(data.filters),
    })
  }

  async update(segment: CustomerSegment, data: CustomerSegmentData): Promise<CustomerSegment> {
    return this.customerSegmentRepository.update(segment, {
      name: data.name,
      filters: compactFilters(data.filters),
    })
  }

  async delete(segment: CustomerSegment): Promise<void> {
    await this.customerSegmentRepository.delete(segment)
  }
}
