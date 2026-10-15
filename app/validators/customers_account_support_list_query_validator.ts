import vine from '@vinejs/vine'

export const customersAccountSupportListQueryValidator = vine.create({
  // Query-string values arrive as text, so numbers/booleans are coerced (bounded below).
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().withoutDecimals().range([1, 50]).optional(),
})
