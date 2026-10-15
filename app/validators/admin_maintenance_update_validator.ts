import vine from '@vinejs/vine'

export const adminMaintenanceUpdateValidator = vine.create({
  active: vine.boolean({ strict: true }),
})
