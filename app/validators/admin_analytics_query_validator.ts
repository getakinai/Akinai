import vine from '@vinejs/vine'
import { ANALYTICS_COMPARES } from '#constants/analytics'

const isoDate = () =>
  vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()

/** Date range (store-timezone days, `to` inclusive) and comparison, shared by analytics queries. */
export const analyticsQueryFields = () => ({
  from: isoDate(),
  to: isoDate(),
  compare: vine.enum(ANALYTICS_COMPARES).optional(),
})

/** Date range and comparison for analytics views. */
export const adminAnalyticsQueryValidator = vine.create(analyticsQueryFields())
