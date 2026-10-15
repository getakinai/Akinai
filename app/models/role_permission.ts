import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BaseAppModel from '#models/base/base_app_model'
import Role from '#models/role'
import { PERMISSION_SECTIONS } from '#abilities/permissions'

const permissionLabels = new Map<string, string>(
  PERMISSION_SECTIONS.flatMap((section) =>
    section.resources.flatMap((resource) =>
      resource.actions.map((action) => [
        `${resource.key}.${action}`,
        `${resource.label}: ${action.charAt(0).toUpperCase()}${action.slice(1)}`,
      ])
    )
  )
)

export default class RolePermission extends BaseAppModel {
  @column()
  declare roleId: string

  @column()
  declare permission: string

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  static auditLabelFor(attributes: Record<string, unknown>): string | null {
    const permission = attributes.permission
    if (typeof permission !== 'string') return null
    return permissionLabels.get(permission) ?? permission
  }
}
