import vine from '@vinejs/vine'

export const customersAccountWishlistListQueryValidator = vine.create({
  // Query-string values arrive as text, so numbers are coerced (bounded below).
  page: vine.number().withoutDecimals().range([1, 1000]).optional(),
})
