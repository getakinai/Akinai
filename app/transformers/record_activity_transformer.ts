import type AuditLog from '#models/audit_log'
import { BaseTransformer } from '@adonisjs/core/transformers'

export type ActivityActor = { kind: 'staff' | 'customer' | 'system'; name: string }

/**
 * A record's audit log entry with who made it. Expects `user` and
 * `customer` to be preloaded (AuditLogRepository.paginateForRecord).
 */
export default class RecordActivityTransformer extends BaseTransformer<AuditLog> {
  protected actor(): ActivityActor {
    const { user, customer } = this.resource
    if (user) return { kind: 'staff', name: user.fullName || user.email }
    if (customer) return { kind: 'customer', name: customer.fullName || customer.email }
    return { kind: 'system', name: 'System' }
  }

  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'action',
        'auditableType',
        'auditableId',
        'auditableLabel',
        'changes',
        'ipAddress',
        'createdAt',
      ]),
      actor: this.actor(),
    }
  }
}
