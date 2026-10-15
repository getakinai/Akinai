import { createHash, timingSafeEqual } from 'node:crypto'
import { inject } from '@adonisjs/core'
import type User from '#models/user'
import RoleRepository from '#repositories/role_repository'
import SetupRepository from '#repositories/setup_repository'
import AuditLogService from '#services/audit_log_service'
import CountryPresetService from '#services/country_preset_service'
import StoreSettingService from '#services/store_setting_service'
import env from '#start/env'

/** Shorter tokens are treated as unset, so setup stays disabled. */
export const MIN_SETUP_TOKEN_LENGTH = 32

export type SetupStatus = { available: boolean; tokenConfigured: boolean }

export type FirstAdminData = {
  fullName: string
  email: string
  password: string
  /** Where the store delivers; picks the starting markets and shipping zones. */
  operatingCountryCode: string
}

export type FirstAdminResult =
  { status: 'created'; user: User } | { status: 'closed' } | { status: 'missing_role' }

function digest(value: string) {
  return createHash('sha256').update(value).digest()
}

/**
 * First-run setup: saves the country of operation, applies its starting
 * defaults, and creates the first admin while no staff User exists,
 * guarded by the one-time SETUP_TOKEN.
 */
@inject()
export default class SetupService {
  constructor(
    protected setupRepository: SetupRepository,
    protected roleRepository: RoleRepository,
    protected auditLogService: AuditLogService,
    protected storeSettingService: StoreSettingService,
    protected countryPresetService: CountryPresetService
  ) {}

  async isRequired(): Promise<boolean> {
    return !(await this.setupRepository.hasAnyUser())
  }

  isTokenConfigured(): boolean {
    const token = env.get('SETUP_TOKEN')?.release()
    return !!token && token.length >= MIN_SETUP_TOKEN_LENGTH
  }

  async status(): Promise<SetupStatus> {
    return { available: await this.isRequired(), tokenConfigured: this.isTokenConfigured() }
  }

  /** Constant-time comparison; false whenever no usable token is configured. */
  verifyToken(candidate: string): boolean {
    const expected = env.get('SETUP_TOKEN')?.release()
    if (!expected || expected.length < MIN_SETUP_TOKEN_LENGTH) return false
    return timingSafeEqual(digest(candidate), digest(expected))
  }

  recordFailedAttempt(ipAddress: string | null) {
    this.auditLogService.logUnknownSubjectEvent('setup_failed', { ipAddress })
  }

  async createFirstAdmin(
    data: FirstAdminData,
    ipAddress: string | null
  ): Promise<FirstAdminResult> {
    const role = await this.roleRepository.findBySlug('admin')
    if (!role) return { status: 'missing_role' }

    await this.storeSettingService.setOperatingCountry(data.operatingCountryCode)
    await this.countryPresetService.applyForStore()

    const user = await this.setupRepository.createFirstUser({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      password: data.password,
      roleId: role.id,
      status: 'active',
    })
    if (!user) return { status: 'closed' }

    await this.auditLogService.recordSecurityEvent('setup_completed', user, { ipAddress })
    return { status: 'created', user }
  }
}
