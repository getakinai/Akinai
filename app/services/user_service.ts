import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import { errors } from '@vinejs/vine'
import type User from '#models/user'
import type { UserStatus } from '#models/user'
import RoleRepository from '#repositories/role_repository'
import AuditLogService from '#services/audit_log_service'
import UserRepository, {
  type CreateUserData,
  type PaginateUsersData,
  type UpdateUserData,
} from '#repositories/user_repository'

export type ListUsersFilters = Partial<PaginateUsersData>

@inject()
export default class UserService {
  constructor(
    protected userRepository: UserRepository,
    protected roleRepository: RoleRepository,
    protected auditLogService: AuditLogService
  ) {}

  /**
   * Throws `E_INVALID_CREDENTIALS` when the email/password pair is wrong.
   */
  async authenticate(email: string, password: string): Promise<User> {
    return this.userRepository.verifyCredentials(email.toLowerCase(), password)
  }

  /**
   * Falls back to the default role when no role is given. New Users are
   * active unless a status is given.
   */
  async create(
    data: Omit<CreateUserData, 'roleId' | 'status'> & {
      roleId?: string | null
      status?: UserStatus
    }
  ): Promise<User> {
    let roleId = data.roleId ?? null
    if (!roleId) {
      const defaultRole = await this.roleRepository.findDefault()
      roleId = defaultRole?.id ?? null
    }
    const user = await this.userRepository.create({
      ...data,
      roleId,
      status: data.status ?? 'active',
      email: data.email.toLowerCase(),
    })
    return this.userRepository.loadRole(user)
  }

  async findByIdOrNull(id: string): Promise<User | null> {
    return this.userRepository.find(id)
  }

  async findOrFail(id: string): Promise<User> {
    return this.userRepository.findOrFail(id)
  }

  /**
   * Preloads `role` (without permissions) for the transformer.
   */
  async findDetail(id: string): Promise<User> {
    return this.userRepository.findWithRoleOrFail(id)
  }

  async update(user: User, data: UpdateUserData): Promise<User> {
    await this.userRepository.update(user, { ...data, email: data.email.toLowerCase() })
    return this.userRepository.loadRole(user)
  }

  /**
   * The signed-in User's own name and email. Role and status are not
   * editable here. Changing the email (the sign-in name) requires the
   * current password, so an unattended session can't take the account.
   * Returns the User with `role.permissions` loaded for the `toMe` view.
   */
  async updateOwnProfile(
    user: User,
    data: { fullName: string | null; email: string; currentPassword?: string }
  ): Promise<User> {
    const email = data.email.toLowerCase()
    if (email !== user.email.toLowerCase()) {
      await this.assertCurrentPassword(
        user,
        data.currentPassword,
        'Enter your current password to change your email'
      )
    }
    await this.userRepository.update(user, { fullName: data.fullName, email })
    return this.loadRole(user)
  }

  /**
   * Changes the signed-in User's own password after checking the current
   * one. Other sessions are signed out by the `sessionVersion` bump.
   */
  async changePassword(
    user: User,
    currentPassword: string,
    password: string,
    ipAddress: string | null
  ): Promise<User> {
    await this.assertCurrentPassword(user, currentPassword)
    const updated = await this.userRepository.changePassword(user, password)
    await this.auditLogService.recordSecurityEvent('password_changed', user, { ipAddress })
    return updated
  }

  protected async assertCurrentPassword(
    user: User,
    currentPassword: string | undefined,
    missingMessage = 'Enter your current password'
  ): Promise<void> {
    const message = !currentPassword
      ? missingMessage
      : (await hash.verify(user.password, currentPassword))
        ? null
        : 'Your current password is incorrect'
    if (message) {
      throw new errors.E_VALIDATION_ERROR([{ field: 'currentPassword', message, rule: 'password' }])
    }
  }

  /**
   * Audits a failed or blocked staff sign-in against the User with that
   * email, or only logs it when no such User exists.
   */
  async recordLoginFailure(
    action: 'login_failed' | 'login_blocked',
    email: string,
    ipAddress: string | null
  ): Promise<void> {
    const user = await this.findByEmail(email)
    if (user) {
      await this.auditLogService.recordSecurityEvent(action, user, { ipAddress })
    } else {
      this.auditLogService.logUnknownSubjectEvent(action, { ipAddress, details: { guard: 'web' } })
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email.toLowerCase())
  }

  /**
   * Preloads `role.permissions` so `user.hasPermission()` can run synchronously.
   */
  async loadRole(user: User): Promise<User> {
    return this.roleRepository.loadForUser(user)
  }

  async paginate(filters: ListUsersFilters = {}) {
    return this.userRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      roleId: filters.roleId,
      sort: filters.sort ?? 'createdAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }
}
