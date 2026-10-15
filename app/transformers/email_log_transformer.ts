import type EmailLog from '#models/email_log'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` is the list row (no body; the repository doesn't select it).
 * `toDetail` adds the body, sender and copies for the detail page.
 */
export default class EmailLogTransformer extends BaseTransformer<EmailLog> {
  toObject() {
    const log = this.resource
    return {
      id: log.id,
      type: log.type,
      subject: log.subject,
      toAddresses: log.toAddresses,
      status: log.status,
      error: log.error,
      redacted: log.redacted,
      sentAt: log.sentAt?.toISO() ?? null,
      orderId: log.orderId,
      customerId: log.customerId,
      resentFromId: log.resentFromId,
      createdAt: log.createdAt.toISO(),
    }
  }

  toDetail() {
    const log = this.resource
    return {
      ...this.toObject(),
      fromAddress: log.fromAddress,
      ccAddresses: log.ccAddresses ?? [],
      bccAddresses: log.bccAddresses ?? [],
      html: log.html,
      text: log.text,
      providerMessageId: log.providerMessageId,
    }
  }
}
