import vine from '@vinejs/vine'
import { listQuerySchema } from '#validators/helpers/list_query'

export const ADMIN_MARKETS_SORT_KEYS = ['name', 'createdAt'] as const

export const adminMarketsListQueryValidator = vine.create({
  ...listQuerySchema(ADMIN_MARKETS_SORT_KEYS),
  status: vine.enum(['active', 'archived'] as const).optional(),
})
