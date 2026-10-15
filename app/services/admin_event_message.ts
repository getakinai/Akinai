import {
  ADMIN_EVENT_CHANNELS,
  PRODUCT_IMPORT_CHANNEL_REGEX,
  type AdminEventChannel,
  type ProductImportChannel,
} from '#constants/admin_events'

export type Broadcastable =
  string | number | boolean | null | Broadcastable[] | { [key: string]: Broadcastable }

/** What travels over Redis: the SSE channel and the browser payload. */
export type AdminEventMessage = {
  channel: AdminEventChannel | ProductImportChannel
  payload: { [key: string]: Broadcastable }
}

export function encodeAdminEventMessage(message: AdminEventMessage): string {
  return JSON.stringify(message)
}

/** Null for anything that isn't a well-formed message for a known channel. */
export function parseAdminEventMessage(raw: string): AdminEventMessage | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const { channel, payload } = parsed as Record<string, unknown>
  if (typeof channel !== 'string') return null
  if (
    !Object.hasOwn(ADMIN_EVENT_CHANNELS, channel) &&
    !PRODUCT_IMPORT_CHANNEL_REGEX.test(channel)
  ) {
    return null
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  return {
    channel: channel as AdminEventMessage['channel'],
    payload: payload as AdminEventMessage['payload'],
  }
}
