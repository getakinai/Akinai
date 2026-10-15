import vine from '@vinejs/vine'
import { ANALYTICS_EXPORT_FORMATS } from '#constants/analytics'
import { analyticsQueryFields } from '#validators/admin_analytics_query_validator'

/** The report's date range and comparison, plus the file format to download. */
export const adminAnalyticsReportExportQueryValidator = vine.create({
  ...analyticsQueryFields(),
  format: vine.enum(ANALYTICS_EXPORT_FORMATS),
})
