import type { Message } from '@adonisjs/mail'
import type { NodeMailerMessage } from '@adonisjs/mail/types'
import { EMAIL_TYPES, type EmailType } from '#constants/email_logs'

/**
 * Internal headers that tell the logging messenger (`start/mail.ts`) what
 * an email is about. They are stripped before the email is sent.
 */
const HEADERS = {
  type: 'X-Hpd-Type',
  orderId: 'X-Hpd-Order-Id',
  customerId: 'X-Hpd-Customer-Id',
  redact: 'X-Hpd-Redact',
  resentFromId: 'X-Hpd-Resent-From',
  resentByUserId: 'X-Hpd-Resent-By',
} as const

export type MailMeta = {
  type: EmailType
  orderId?: string | null
  customerId?: string | null
  /** The body holds a secret (one-time code), so it is never stored. */
  redact?: boolean
  resentFromId?: string | null
  resentByUserId?: string | null
}

export function tagMail(message: Message, meta: MailMeta) {
  message.header(HEADERS.type, meta.type)
  if (meta.orderId) message.header(HEADERS.orderId, meta.orderId)
  if (meta.customerId) message.header(HEADERS.customerId, meta.customerId)
  if (meta.redact) message.header(HEADERS.redact, '1')
  if (meta.resentFromId) message.header(HEADERS.resentFromId, meta.resentFromId)
  if (meta.resentByUserId) message.header(HEADERS.resentByUserId, meta.resentByUserId)
}

type ResolvedMailMeta = Required<Omit<MailMeta, 'redact'>> & { redact: boolean }

/**
 * Reads and removes the internal headers from a compiled message, so they
 * never reach the recipient.
 */
export function takeMailMeta(message: NodeMailerMessage): ResolvedMailMeta {
  const headers =
    message.headers && !Array.isArray(message.headers)
      ? (message.headers as Record<string, unknown>)
      : {}
  const read = (key: string) => {
    const value = headers[key]
    delete headers[key]
    return typeof value === 'string' && value.length > 0 ? value : null
  }

  const type = read(HEADERS.type)
  return {
    type: EMAIL_TYPES.find((known) => known === type) ?? 'other',
    orderId: read(HEADERS.orderId),
    customerId: read(HEADERS.customerId),
    redact: read(HEADERS.redact) === '1',
    resentFromId: read(HEADERS.resentFromId),
    resentByUserId: read(HEADERS.resentByUserId),
  }
}
