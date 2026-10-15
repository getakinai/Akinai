import type { MaintenanceDriver } from '@foadonis/maintenance'
import maintenanceService from '@foadonis/maintenance/services/main'

/**
 * Same payload `node ace down` writes with no flags, so the CLI and the
 * back-office switch stay interchangeable.
 */
const DOWN_PAYLOAD = { status: 503 }

export default class MaintenanceRepository {
  // The package's `DriversList` typing always resolves `driver()` to `never`.
  private driver() {
    return maintenanceService.driver() as MaintenanceDriver
  }

  isActive() {
    return this.driver().active()
  }

  async activate() {
    await this.driver().activate(DOWN_PAYLOAD)
  }

  async deactivate() {
    await this.driver().deactivate()
  }
}
