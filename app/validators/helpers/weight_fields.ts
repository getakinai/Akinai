import vine from '@vinejs/vine'

export const MAX_WEIGHT = 99_999

/** A weight in the store's weight unit, up to 3 decimals. */
export const weightAmount = () =>
  vine.number({ strict: true }).min(0).max(MAX_WEIGHT).decimal([0, 3])
