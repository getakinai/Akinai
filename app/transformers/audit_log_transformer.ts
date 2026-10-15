import type AuditLog from '#models/audit_log'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AuditLogTransformer extends BaseTransformer<AuditLog> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'action',
      'auditableType',
      'auditableId',
      'auditableLabel',
      'changes',
      'ipAddress',
      'createdAt',
    ])
  }
}
