import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import type Role from '#models/role'
import type User from '#models/user'
import RoleRepository from '#repositories/role_repository'
import type { Permission } from '#abilities/permissions'

export type RoleInput = {
  name: string
  description: string | null
}

@inject()
export default class RoleService {
  constructor(protected roleRepository: RoleRepository) {}

  async all(): Promise<Role[]> {
    return this.roleRepository.allWithPermissions()
  }

  /**
   * Roles without permissions, for pickers such as the user role select.
   */
  async options(): Promise<Role[]> {
    return this.roleRepository.allOrdered()
  }

  async findOrFail(id: string): Promise<Role> {
    return this.roleRepository.findOrFail(id)
  }

  async findBySlug(slug: string): Promise<Role | null> {
    return this.roleRepository.findBySlug(slug)
  }

  async findDefault(): Promise<Role | null> {
    return this.roleRepository.findDefault()
  }

  async countUsers(role: Role): Promise<number> {
    return this.roleRepository.countUsers(role)
  }

  async create({ name, description }: RoleInput): Promise<Role> {
    const role = await this.roleRepository.create({
      name,
      description,
      slug: await this.uniqueSlug(name),
      sortOrder: (await this.roleRepository.maxSortOrder()) + 1,
    })
    return this.roleRepository.loadPermissions(role)
  }

  async update(role: Role, { name, description }: RoleInput): Promise<Role> {
    const slug = name === role.name ? role.slug : await this.uniqueSlug(name, role.id)
    await this.roleRepository.update(role, { name, description, slug })
    return this.roleRepository.loadPermissions(role)
  }

  async delete(role: Role): Promise<void> {
    await this.roleRepository.delete(role)
  }

  async setPermission(role: Role, permission: Permission, granted: boolean): Promise<Role> {
    if (granted) {
      await this.roleRepository.grant(role, permission)
    } else {
      await this.roleRepository.revoke(role, permission)
    }
    return this.roleRepository.loadPermissions(role)
  }

  async syncPermissions(role: Role, permissions: Permission[]): Promise<void> {
    await this.roleRepository.syncPermissions(role, permissions)
  }

  /**
   * Creates the role when missing. Existing roles keep their edited permissions.
   */
  async ensure(
    data: {
      slug: string
      name: string
      description: string
      isLocked?: boolean
      isDefault?: boolean
      sortOrder: number
    },
    permissions: Permission[]
  ): Promise<Role> {
    const existing = await this.roleRepository.findBySlug(data.slug)
    if (existing) {
      return existing
    }
    const role = await this.roleRepository.create(data)
    await this.roleRepository.syncPermissions(role, permissions)
    return role
  }

  async loadForUser(user: User): Promise<User> {
    return this.roleRepository.loadForUser(user)
  }

  async assignToUser(user: User, role: Role): Promise<User> {
    return this.roleRepository.assignToUser(user, role)
  }

  protected async uniqueSlug(name: string, ignoreId?: string): Promise<string> {
    const base = string.slug(name, { lower: true, strict: true }) || 'role'
    let slug = base
    let suffix = 2

    for (;;) {
      const existing = await this.roleRepository.findBySlug(slug)
      if (!existing || existing.id === ignoreId) {
        return slug
      }
      slug = `${base}-${suffix++}`
    }
  }
}
