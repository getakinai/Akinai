import vine from '@vinejs/vine'

export const customersAccountHomeQueryValidator = vine.create({
  placed: vine.string().uuid().optional(),
})
