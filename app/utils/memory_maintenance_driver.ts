import type { MaintenanceDriver } from '@foadonis/maintenance'
import type { DownPayload } from '@foadonis/maintenance/types'

/**
 * Keeps maintenance state in the process instead of Redis. Used by the
 * test environment, so running `node ace down` for the dev server doesn't
 * put the test server into maintenance mode too.
 */
export class MemoryMaintenanceDriver implements MaintenanceDriver {
  #data: DownPayload | null = null

  async activate(data: DownPayload) {
    this.#data = data
  }

  async deactivate() {
    this.#data = null
  }

  async active() {
    return this.#data !== null
  }

  async data() {
    if (!this.#data) {
      throw new Error('Maintenance mode is not active')
    }
    return this.#data
  }
}
