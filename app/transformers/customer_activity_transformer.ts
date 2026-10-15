import type AuditLog from '#models/audit_log'
import type { AuditValue } from '#models/audit_log'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** Internal keys customers never see: record ids and foreign keys. */
function isInternalKey(key: string) {
  return key === 'id' || key.endsWith('Id')
}

function visible(values: Record<string, AuditValue> | null) {
  if (!values) return null
  return Object.fromEntries(Object.entries(values).filter(([key]) => !isInternalKey(key)))
}

/**
 * An entry in the customer's own account activity. Drops ids and the
 * staff-only `labels` from the recorded changes.
 */
export default class CustomerActivityTransformer extends BaseTransformer<AuditLog> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'action',
        'auditableType',
        'auditableLabel',
        'ipAddress',
        'createdAt',
      ]),
      changes: {
        before: visible(this.resource.changes.before) ?? {},
        after: visible(this.resource.changes.after),
      },
    }
  }
}
