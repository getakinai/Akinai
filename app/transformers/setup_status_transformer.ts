import { BaseTransformer } from '@adonisjs/core/transformers'
import type { SetupStatus } from '#services/setup_service'

/**
 * Whether first-run setup is still open and whether SETUP_TOKEN is set.
 * Never includes the token itself.
 */
export default class SetupStatusTransformer extends BaseTransformer<SetupStatus> {
  toObject() {
    return {
      available: this.resource.available,
      tokenConfigured: this.resource.tokenConfigured,
    }
  }
}
