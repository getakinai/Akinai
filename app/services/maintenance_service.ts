import { inject } from '@adonisjs/core'
import MaintenanceRepository from '#repositories/maintenance_repository'
import AuditLogService, { type SecuritySubject } from '#services/audit_log_service'

export type MaintenanceStatus = { active: boolean }

@inject()
export default class MaintenanceService {
  constructor(
    protected maintenanceRepository: MaintenanceRepository,
    protected auditLogService: AuditLogService
  ) {}

  async status(): Promise<MaintenanceStatus> {
    return { active: await this.maintenanceRepository.isActive() }
  }

  /**
   * Turns storefront maintenance mode on or off. Does nothing (and records
   * nothing) when the store is already in the requested state.
   */
  async setActive(
    active: boolean,
    user: SecuritySubject,
    ipAddress: string | null
  ): Promise<MaintenanceStatus> {
    if ((await this.maintenanceRepository.isActive()) === active) {
      return { active }
    }

    if (active) {
      await this.maintenanceRepository.activate()
    } else {
      await this.maintenanceRepository.deactivate()
    }

    await this.auditLogService.recordSecurityEvent(
      active ? 'maintenance_enabled' : 'maintenance_disabled',
      user,
      { ipAddress }
    )
    return { active }
  }
}
