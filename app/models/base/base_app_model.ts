import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import {
  BaseModel,
  afterDelete,
  afterUpdate,
  beforeCreate,
  beforeUpdate,
  column,
} from '@adonisjs/lucid/orm'
import { v7 as uuidv7 } from 'uuid'
import type { AuditChanges } from '#models/audit_log'
import { auditActor } from '#services/audit_actor'

const pendingAudits = new WeakMap<BaseAppModel, AuditChanges>()

const AUDIT_LABEL_ATTRIBUTES = ['name', 'title', 'fullName', 'email', 'label', 'value']

/**
 * Imported lazily because AuditLog itself extends BaseAppModel.
 */
async function auditLogService() {
  const { default: AuditLogService } = await import('#services/audit_log_service')
  return app.container.make(AuditLogService)
}

function auditOptions(model: BaseAppModel) {
  const Model = model.constructor as typeof BaseAppModel
  if (model.$skipAudit) return null
  return Model.auditable && auditActor.current() ? { hidden: Model.auditHidden } : null
}

export default class BaseAppModel extends BaseModel {
  public static selfAssignPrimaryKey = true
  public static incrementing = false

  /**
   * Updates and deletes made during a staff request are written to
   * `audit_logs`. Creates are not logged. Query-builder updates/deletes
   * bypass these hooks.
   */
  static auditable = true

  /**
   * Attributes whose values are replaced with `[hidden]` in audit logs.
   */
  static auditHidden: readonly string[] = ['password']

  /**
   * Readable name for a record in audit logs. Override on models whose
   * name lives in another attribute; return null to fall back to the
   * names of the records it belongs to.
   */
  static auditLabelFor(attributes: Record<string, unknown>): string | null {
    for (const key of AUDIT_LABEL_ATTRIBUTES) {
      const value = attributes[key]
      if (typeof value === 'string' && value.length > 0) {
        return value.slice(0, 255)
      }
    }
    return null
  }

  /**
   * Set when the caller records its own audit entry for this save, so the
   * hooks don't write a second, less complete one.
   */
  $skipAudit = false

  @column({ isPrimary: true })
  declare id: string

  @column.dateTime({
    serializeAs: 'created_at',
    autoCreate: true,
  })
  declare createdAt: DateTime

  @column.dateTime({
    serializeAs: 'updated_at',
    autoCreate: true,
    autoUpdate: true,
  })
  declare updatedAt: DateTime | null

  @beforeCreate()
  public static async setPK<T extends BaseAppModel>(model: T) {
    model.id = uuidv7()
  }

  /**
   * Lucid resets `$original` before `afterUpdate`, so the diff is taken here.
   */
  @beforeUpdate()
  public static async captureAuditDiff<T extends BaseAppModel>(model: T) {
    const options = auditOptions(model)
    if (!options) return

    const service = await auditLogService()
    const changes = service.diff(model, options)
    if (changes) pendingAudits.set(model, changes)
  }

  @afterUpdate()
  public static async auditUpdate<T extends BaseAppModel>(model: T) {
    const changes = pendingAudits.get(model)
    if (!changes) return

    pendingAudits.delete(model)
    const service = await auditLogService()
    await service.record(model, 'updated', changes)
  }

  @afterDelete()
  public static async auditDelete<T extends BaseAppModel>(model: T) {
    const options = auditOptions(model)
    if (!options) return

    const service = await auditLogService()
    await service.record(model, 'deleted', service.snapshot(model, options))
  }
}
