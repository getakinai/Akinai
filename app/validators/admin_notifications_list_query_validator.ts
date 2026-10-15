import vine from '@vinejs/vine'

export const adminNotificationsListQueryValidator = vine.create({
  filter: vine.enum(['all', 'unread'] as const).optional(),
  // Query-string values arrive as text, so numbers are coerced (bounded below).
  page: vine.number().withoutDecimals().min(1).max(1000).optional(),
  perPage: vine.number().in([15, 25]).optional(),
})
