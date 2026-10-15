/*
|--------------------------------------------------------------------------
| Event listeners
|--------------------------------------------------------------------------
*/

import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'

/**
 * Emails sent with `sendLater` fail in the background, so log them.
 */
emitter.on('queued:mail:error', ({ error, mailerName }) => {
  logger.error({ err: error, mailer: mailerName }, 'Queued email failed to send')
})
