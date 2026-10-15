import type { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import BaseAppModel from '#models/base/base_app_model'
import Role from '#models/role'
import type { Permission } from '#abilities/permissions'

export const USER_STATUSES = ['active', 'pending', 'inactive'] as const

export type UserStatus = (typeof USER_STATUSES)[number]

/**
 * Back-office staff member. Authenticated through the `web` guard. Only
 * `active` Users may sign in.
 */
export default class User extends compose(
  BaseAppModel,
  withAuthFinder(() => hash.use())
) {
  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare status: UserStatus

  @column()
  declare roleId: string | null

  /** TOTP secret, encrypted with the `user-mfa` purpose. */
  @column({ serializeAs: null })
  declare mfaSecret: string | null

  @column.dateTime()
  declare mfaEnabledAt: DateTime | null

  /** Last time the notifications panel was opened; resets the bell badge. */
  @column.dateTime()
  declare notificationsSeenAt: DateTime | null

  /** Hashes of the unused recovery codes. */
  @column({
    serializeAs: null,
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
  })
  declare mfaRecoveryCodes: string[] | null

  /** Last accepted TOTP time step, so a code can't be replayed. */
  @column({ serializeAs: null })
  declare mfaLastTimeStep: number | null

  /**
   * Bumped when the password changes or MFA is turned off. Sessions that
   * stored an older value are signed out by `UserSessionVersionMiddleware`.
   */
  @column({ serializeAs: null })
  declare sessionVersion: number

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  static auditHidden = ['password', 'mfaSecret', 'mfaRecoveryCodes', 'mfaLastTimeStep']

  get isActive() {
    return this.status === 'active'
  }

  get mfaEnabled(): boolean {
    return this.mfaEnabledAt !== null && this.mfaSecret !== null
  }

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  /**
   * Requires `role.permissions` to be preloaded (see InitializeBouncerMiddleware).
   */
  get permissionKeys(): Permission[] {
    return this.role ? this.role.permissionKeys : []
  }

  /** Holds the locked admin role. Requires `role` to be preloaded. */
  get isAdmin(): boolean {
    return this.role?.isLocked ?? false
  }

  hasPermission(permission: Permission): boolean {
    return this.permissionKeys.includes(permission)
  }
}
