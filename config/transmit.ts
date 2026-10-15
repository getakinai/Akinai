import { defineConfig } from '@adonisjs/transmit'

/**
 * Server-Sent Events for live admin notifications. No Transmit transport:
 * instances share events over our own Redis pub/sub channel
 * (`start/transmit.ts`) so delivery failures can be recorded and retried.
 */
export default defineConfig({
  pingInterval: '30s',
  transport: null,
})
