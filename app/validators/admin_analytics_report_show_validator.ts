import vine from '@vinejs/vine'
import { ANALYTICS_REPORT_KEYS } from '#constants/analytics_reports'

/** Report key from the route (`:key`). Unknown keys are a 404. */
export const adminAnalyticsReportShowValidator = vine.create({
  key: vine.enum(ANALYTICS_REPORT_KEYS),
})
