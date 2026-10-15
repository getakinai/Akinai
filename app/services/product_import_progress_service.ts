import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { PRODUCT_IMPORT_PROGRESS_INTERVAL_MS, productImportChannel } from '#constants/admin_events'
import AdminEventPublisher from '#services/admin_event_publisher'

export type ProductImportPhase = 'reading' | 'images' | 'saving'

/** Called as an import moves along; `done` of `total` within the phase. */
export type ProductImportProgress = (phase: ProductImportPhase, done: number, total: number) => void

export const noProgress: ProductImportProgress = () => {}

/**
 * Sends a staff user's product import progress to their browser over the
 * live admin events stream. Messages are throttled; a phase change and the
 * last step of a phase always go out. Publishing is best-effort and never
 * fails the import.
 */
@inject()
export default class ProductImportProgressService {
  constructor(protected publisher: AdminEventPublisher) {}

  reporter(userId: string, importId: string | undefined): ProductImportProgress {
    if (!importId) return noProgress

    const channel = productImportChannel(userId)
    let lastPhase: ProductImportPhase | null = null
    let lastSentAt = 0

    return (phase, done, total) => {
      const now = Date.now()
      const due =
        phase !== lastPhase ||
        done >= total ||
        now - lastSentAt >= PRODUCT_IMPORT_PROGRESS_INTERVAL_MS
      if (!due) return
      lastPhase = phase
      lastSentAt = now

      this.publisher
        .publish({ channel, payload: { importId, phase, done, total } })
        .catch((error: unknown) => {
          logger.warn(
            { err: error, event: 'product_import.progress_failed' },
            'Could not send product import progress'
          )
        })
    }
  }
}
