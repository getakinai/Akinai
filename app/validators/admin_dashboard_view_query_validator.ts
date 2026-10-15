import vine from '@vinejs/vine'
import { DASHBOARD_RANGES } from '#constants/dashboard'

export const adminDashboardViewQueryValidator = vine.create({
  range: vine.enum(DASHBOARD_RANGES).optional(),
})
