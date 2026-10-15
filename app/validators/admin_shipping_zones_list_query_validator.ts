import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_SHIPPING_ZONES_SORT_KEYS = ['name', 'createdAt'] as const

export const adminShippingZonesListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_SHIPPING_ZONES_SORT_KEYS),
  status: vine.enum(['active', 'archived'] as const).optional(),
})
