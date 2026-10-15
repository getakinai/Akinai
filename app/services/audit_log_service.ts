import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import type {
  AuditAction,
  AuditChanges,
  AuditReferenceLabel,
  AuditValue,
  OrderEventAction,
  SecurityAction,
} from '#models/audit_log'
import { SECURITY_ALERT_ACTIONS } from '#models/audit_log'
import type Order from '#models/order'
import AuditLogRepository, { type ActivityFilters } from '#repositories/audit_log_repository'
import AdminEventService from '#services/admin_event_service'
import { auditActor, type AuditActor } from '#services/audit_actor'
import { orderAuditLabel } from '#services/order_audit'

const IGNORED_ATTRIBUTES = ['createdAt', 'updatedAt']

export type AuditableModel = LucidRow & { id: string }

export type AuditOptions = {
  hidden: readonly string[]
}

/** The account a security event is about. `type` defaults to `User`. */
export type SecuritySubject = {
  id: string
  email: string
  fullName: string | null
  type?: 'User' | 'Customer'
}

type LabelledModel = LucidModel & {
  auditLabelFor?: (attributes: Record<string, unknown>) => string | null
}

type Reference = { key: string; Related: LabelledModel }

export type ActivityListFilters = ActivityFilters & { page?: number; perPage?: number }

function toAuditValue(value: unknown): AuditValue {
  if (value === undefined || value === null) return null
  if (DateTime.isDateTime(value)) return value.toISO()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as AuditValue
}

function pickAttributes(
  attributes: Record<string, unknown>,
  keys: string[],
  hidden: readonly string[]
): Record<string, AuditValue> {
  return Object.fromEntries(
    keys
      .filter((key) => !IGNORED_ATTRIBUTES.includes(key))
      .map((key) => [key, hidden.includes(key) ? '[hidden]' : toAuditValue(attributes[key])])
  )
}

@inject()
export default class AuditLogService {
  constructor(
    protected auditLogRepository: AuditLogRepository,
    protected adminEventService: AdminEventService
  ) {}

  /**
   * Snapshot of the attributes about to change, taken before Lucid resets
   * `$original`. Returns null when nothing worth logging changed.
   */
  diff(model: AuditableModel, { hidden }: AuditOptions): AuditChanges | null {
    const keys = Object.keys(model.$dirty).filter((key) => !IGNORED_ATTRIBUTES.includes(key))
    if (keys.length === 0) {
      return null
    }
    return {
      before: pickAttributes(model.$original, keys, hidden),
      after: pickAttributes(model.$attributes, keys, hidden),
    }
  }

  snapshot(model: AuditableModel, { hidden }: AuditOptions): AuditChanges {
    return {
      before: pickAttributes(
        model.$attributes,
        Object.keys(model.$attributes).filter((key) => key !== 'id'),
        hidden
      ),
      after: null,
    }
  }

  /**
   * No-op outside a staff or customer account request (seeders, guest
   * storefront, ace commands).
   * Names the record and every changed foreign key while the referenced
   * records still exist, so the log stays readable after they are gone.
   */
  async record(model: AuditableModel, action: AuditAction, changes: AuditChanges) {
    const actor = auditActor.current()
    if (!actor) {
      return null
    }

    const Model = model.constructor as LabelledModel
    const trx = model.$trx
    const labels: Record<string, AuditReferenceLabel> = {}
    const parentLabels: string[] = []

    for (const { key, Related } of this.references(Model)) {
      const current = await this.referenceLabel(Related, model.$attributes[key], trx)
      if (current) parentLabels.push(current)
      if (!(key in changes.before)) continue

      labels[key] =
        action === 'updated'
          ? { before: await this.referenceLabel(Related, changes.before[key], trx), after: current }
          : { before: current, after: null }
    }

    const ownLabel = Model.auditLabelFor?.({ ...model.$attributes, ...changes.before }) ?? null

    return this.auditLogRepository.create(
      {
        userId: actor.userId,
        customerId: actor.customerId ?? null,
        action,
        auditableType: Model.name,
        auditableId: model.id,
        auditableLabel: ownLabel ?? (parentLabels.join(' · ').slice(0, 255) || null),
        changes: Object.keys(labels).length > 0 ? { ...changes, labels } : changes,
        ipAddress: actor.ipAddress,
      },
      trx
    )
  }

  /**
   * Logs a set-based update (`query().whereIn(...).update(...)`), which
   * skips model hooks. `rows` hold the values from before the update and
   * `after` the attributes that were set. One insert for all rows. Does not
   * resolve belongs-to labels, so use it for changes to own columns only.
   * No-op outside a staff request.
   */
  async recordBulkUpdate(
    Model: LucidModel & { auditable?: boolean; auditHidden?: readonly string[] },
    rows: AuditableModel[],
    after: Record<string, unknown>
  ) {
    await this.recordBulkChanges(
      Model,
      rows.map((row) => ({ row, after }))
    )
  }

  /**
   * Like `recordBulkUpdate`, for set-based updates that set a different
   * value on each row (e.g. rebuilt titles). One insert for all rows.
   */
  async recordBulkChanges(
    Model: LucidModel & { auditable?: boolean; auditHidden?: readonly string[] },
    entries: { row: AuditableModel; after: Record<string, unknown> }[]
  ) {
    const actor = auditActor.current()
    if (!actor?.userId || entries.length === 0 || Model.auditable === false) return

    const hidden = Model.auditHidden ?? []
    const labelFor = (Model as LabelledModel).auditLabelFor

    await this.auditLogRepository.createMany(
      entries.map(({ row, after }) => {
        const keys = Object.keys(after).filter((key) => !IGNORED_ATTRIBUTES.includes(key))
        return {
          userId: actor.userId,
          action: 'updated' as const,
          auditableType: Model.name,
          auditableId: row.id,
          auditableLabel: labelFor?.(row.$attributes) ?? null,
          changes: {
            before: pickAttributes(row.$attributes, keys, hidden),
            after: pickAttributes(after, keys, hidden),
          },
          ipAddress: actor.ipAddress,
        }
      })
    )
  }

  /**
   * Logs records created in bulk (e.g. a CSV import) with one insert.
   * `details` is stored as the `after` of every row. No-op outside a staff
   * request.
   */
  async recordBulkCreate(
    Model: LucidModel & { auditable?: boolean },
    rows: AuditableModel[],
    details: Record<string, AuditValue>
  ) {
    const actor = auditActor.current()
    if (!actor?.userId || rows.length === 0 || Model.auditable === false) return

    const labelFor = (Model as LabelledModel).auditLabelFor

    await this.auditLogRepository.createMany(
      rows.map((row) => ({
        userId: actor.userId,
        action: 'created' as const,
        auditableType: Model.name,
        auditableId: row.id,
        auditableLabel: labelFor?.(row.$attributes)?.slice(0, 255) ?? null,
        changes: { before: {}, after: details },
        ipAddress: actor.ipAddress,
      }))
    )
  }

  /**
   * Logged explicitly because signing in doesn't change a record. Runs on a
   * guest route, so there is no audit actor to read.
   */
  async recordLogin(
    user: AuditableModel & { fullName: string | null; email: string },
    ipAddress: string | null
  ) {
    return this.recordSecurityEvent('logged_in', user, { ipAddress })
  }

  /**
   * A security event about a staff User or a Customer. Often runs on guest
   * routes, so the subject is passed in rather than read from the actor.
   * Events that may signal an attack are also logged at `warn` with a
   * stable `event` field, so a log drain can alert on bursts.
   */
  async recordSecurityEvent(
    action: SecurityAction,
    subject: SecuritySubject,
    context: { ipAddress: string | null; details?: Record<string, AuditValue> }
  ) {
    const isCustomer = subject.type === 'Customer'
    const fields = {
      event: `security.${action}`,
      subjectType: subject.type ?? 'User',
      subjectId: subject.id,
      ip: context.ipAddress,
      ...context.details,
    }
    if (SECURITY_ALERT_ACTIONS.includes(action)) {
      logger.warn(fields, `Security event: ${action}`)
    } else {
      logger.info(fields, `Security event: ${action}`)
    }

    return this.auditLogRepository.create({
      userId: isCustomer ? null : subject.id,
      customerId: isCustomer ? subject.id : null,
      action,
      auditableType: subject.type ?? 'User',
      auditableId: subject.id,
      auditableLabel: (subject.fullName || subject.email).slice(0, 255),
      changes: { before: {}, after: context.details ?? null },
      ipAddress: context.ipAddress,
    })
  }

  /**
   * A staff User starting or ending a storefront session as a Customer.
   * The row carries both ids, so it shows on the staff User's and the
   * Customer's admin activity; the customer's own feed only lists
   * `updated` / `deleted`, so they never see the reason.
   */
  async recordImpersonation(
    action: Extract<SecurityAction, 'impersonation_started' | 'impersonation_stopped'>,
    staff: { id: string },
    customer: { id: string; email: string; fullName: string | null },
    context: { ipAddress: string | null; reason?: string | null }
  ) {
    const details: Record<string, AuditValue> = context.reason ? { reason: context.reason } : {}
    const fields = {
      event: `security.${action}`,
      subjectType: 'Customer',
      subjectId: customer.id,
      staffUserId: staff.id,
      ip: context.ipAddress,
      ...details,
    }
    if (SECURITY_ALERT_ACTIONS.includes(action)) {
      logger.warn(fields, `Security event: ${action}`)
    } else {
      logger.info(fields, `Security event: ${action}`)
    }

    return this.auditLogRepository.create({
      userId: staff.id,
      customerId: customer.id,
      action,
      auditableType: 'Customer',
      auditableId: customer.id,
      auditableLabel: (customer.fullName || customer.email).slice(0, 255),
      changes: { before: {}, after: details },
      ipAddress: context.ipAddress,
    })
  }

  /**
   * A security event with no known account (e.g. a failed sign-in for an
   * email that doesn't exist). Only logged, since audit rows need a record.
   */
  logUnknownSubjectEvent(
    action: SecurityAction,
    context: { ipAddress: string | null; details?: Record<string, AuditValue> }
  ) {
    logger.warn(
      { event: `security.${action}`, ip: context.ipAddress, ...context.details },
      `Security event: ${action}`
    )
  }

  /**
   * An event in an order's timeline. Written even outside a staff or
   * account request (checkout, Stripe): the request actor wins, then
   * `fallback`, else the change is attributed to the system.
   */
  async recordOrderEvent(
    order: Order,
    action: OrderEventAction,
    changes: AuditChanges,
    fallback?: AuditActor
  ) {
    const actor = auditActor.current() ?? fallback ?? { userId: null, ipAddress: null }
    const log = await this.auditLogRepository.create({
      userId: actor.userId,
      customerId: actor.customerId ?? null,
      action,
      auditableType: 'Order',
      auditableId: order.id,
      auditableLabel: orderAuditLabel(order),
      changes,
      ipAddress: actor.ipAddress,
    })
    await this.adminEventService.recordOrderEvent(order, action, changes, actor)
    return log
  }

  /**
   * A staff action that changes no record columns (e.g. resending an
   * email). No-op outside a staff request.
   */
  async recordStaffEvent(
    subject: { type: string; id: string; label: string | null },
    action: AuditAction,
    details: Record<string, AuditValue>
  ) {
    const actor = auditActor.current()
    if (!actor?.userId) return null

    return this.auditLogRepository.create({
      userId: actor.userId,
      customerId: null,
      action,
      auditableType: subject.type,
      auditableId: subject.id,
      auditableLabel: subject.label?.slice(0, 255) ?? null,
      changes: { before: {}, after: details },
      ipAddress: actor.ipAddress,
    })
  }

  async paginateForRecord(
    auditableType: string,
    auditableId: string,
    { page, perPage, ...filters }: ActivityListFilters = {}
  ) {
    return this.auditLogRepository.paginateForRecord({
      ...filters,
      auditableType,
      auditableId,
      page: page ?? 1,
      perPage: perPage ?? 15,
    })
  }

  async paginateForProduct(
    productId: string,
    variantIds: string[],
    { page, perPage, ...filters }: ActivityListFilters = {}
  ) {
    return this.auditLogRepository.paginateForProduct({
      ...filters,
      productId,
      variantIds,
      page: page ?? 1,
      perPage: perPage ?? 15,
    })
  }

  async paginateForCustomer(customerId: string, filters: { page?: number; perPage?: number } = {}) {
    return this.auditLogRepository.paginateForCustomer({
      customerId,
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 10,
    })
  }

  async paginateCustomerHistory(
    customerId: string,
    { page, perPage, ...filters }: ActivityListFilters = {}
  ) {
    return this.auditLogRepository.paginateCustomerHistory({
      ...filters,
      customerId,
      page: page ?? 1,
      perPage: perPage ?? 15,
    })
  }

  async paginateForUser(userId: string, { page, perPage, ...filters }: ActivityListFilters = {}) {
    return this.auditLogRepository.paginateForUser({
      ...filters,
      userId,
      page: page ?? 1,
      perPage: perPage ?? 15,
    })
  }

  protected references(Model: LabelledModel): Reference[] {
    const references: Reference[] = []
    for (const relation of Model.$relationsDefinitions.values()) {
      if (relation.type !== 'belongsTo') continue
      relation.boot()
      references.push({ key: relation.foreignKey, Related: relation.relatedModel() })
    }
    return references
  }

  protected async referenceLabel(
    Related: LabelledModel,
    id: unknown,
    trx: TransactionClientContract | undefined
  ): Promise<string | null> {
    if (typeof id !== 'string' || id.length === 0) {
      return null
    }
    const row = await this.auditLogRepository.findReferenced(Related, id, trx)
    return row ? (Related.auditLabelFor?.(row.$attributes) ?? null) : null
  }
}
