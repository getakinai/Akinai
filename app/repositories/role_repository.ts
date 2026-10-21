import db from '@adonisjs/lucid/services/db'
import Role from '#models/role'
import RolePermission from '#models/role_permission'
import type User from '#models/user'
import type { Permission } from '#abilities/permissions'

export type CreateRoleData = {
  name: string
  slug: string
  description: string | null
  isLocked?: boolean
  isDefault?: boolean
  sortOrder?: number
}

export type UpdateRoleData = {
  name: string
  slug: string
  description: string | null
}

export default class RoleRepository {
  async allWithPermissions(): Promise<Role[]> {
    return Role.query()
      .preload('permissions')
      .withCount('users')
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
  }

  async allOrdered(): Promise<Role[]> {
    return Role.query()
      .preload('permissions')
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
  }

  async find(id: string): Promise<Role | null> {
    return Role.find(id)
  }

  async findOrFail(id: string): Promise<Role> {
    return Role.findOrFail(id)
  }

  async findBySlug(slug: string): Promise<Role | null> {
    return Role.findBy('slug', slug)
  }

  async findDefault(): Promise<Role | null> {
    return Role.findBy('is_default', true)
  }

  async maxSortOrder(): Promise<number> {
    const row = await Role.query().max('sort_order as max').first()
    return Number(row?.$extras.max ?? 0)
  }

  async countUsers(role: Role): Promise<number> {
    const row = await db.from('users').where('role_id', role.id).count('* as total').first()
    return Number(row?.total ?? 0)
  }

  async create(data: CreateRoleData): Promise<Role> {
    return Role.create({ isLocked: false, isDefault: false, sortOrder: 0, ...data })
  }

  async update(role: Role, data: UpdateRoleData): Promise<Role> {
    return role.merge(data).save()
  }

  async delete(role: Role): Promise<void> {
    await role.delete()
  }

  async loadPermissions(role: Role): Promise<Role> {
    await role.load('permissions')
    return role
  }

  async grant(role: Role, permission: Permission): Promise<void> {
    const existing = await RolePermission.query()
      .where('role_id', role.id)
      .where('permission', permission)
      .first()

    if (!existing) {
      await RolePermission.create({ roleId: role.id, permission })
    }
  }

  /**
   * Deletes through the model (not the query builder) so the revoke is audited.
   */
  async revoke(role: Role, permission: Permission): Promise<void> {
    const grant = await RolePermission.query()
      .where('role_id', role.id)
      .where('permission', permission)
      .first()
    await grant?.delete()
  }

  /**
   * Replaces the role's permissions in one transaction.
   */
  async syncPermissions(role: Role, permissions: Permission[]): Promise<void> {
    await db.transaction(async (trx) => {
      await RolePermission.query({ client: trx }).where('role_id', role.id).delete()
      if (permissions.length > 0) {
        await RolePermission.createMany(
          permissions.map((permission) => ({ roleId: role.id, permission })),
          { client: trx }
        )
      }
    })
  }

  async loadForUser(user: User): Promise<User> {
    if (user.roleId) {
      await user.load('role', (query) => query.preload('permissions'))
    }
    return user
  }

  async assignToUser(user: User, role: Role): Promise<User> {
    user.roleId = role.id
    await user.save()
    return user
  }
}
