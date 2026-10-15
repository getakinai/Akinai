import vine from '@vinejs/vine'
import { AUDIT_ACTIONS } from '#models/audit_log'

/**
 * Optional filters shared by the back-office activity feeds: a search in
 * the changed values, one action, and an inclusive `yyyy-MM-dd` day range.
 */
export function activityFiltersSchema() {
  return {
    q: vine.string().trim().maxLength(100).optional(),
    action: vine.enum(AUDIT_ACTIONS).optional(),
    dateFrom: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
    dateTo: vine
      .date({ formats: ['YYYY-MM-DD'] })
      .afterOrSameAs('dateFrom')
      .optional(),
  }
}
