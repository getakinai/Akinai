import { BaseMail } from '@adonisjs/mail'
import type { EmailType } from '#constants/email_logs'
import { tagMail } from '#mails/helpers/mail_meta'
import type { CustomerNotice } from '#mails/customer_notice_mail'

export type SupportTicketMailOptions = {
  to: string | string[]
  subject: string
  notice: CustomerNotice
  customerId: string | null
  /** Set when the body holds the customer's private thread link, so it is never stored. */
  redact: boolean
}

/**
 * An email about a support ticket, rendered with the shared
 * `emails/customer_notice` templates.
 */
export default abstract class SupportTicketMail extends BaseMail {
  /** Email type shown in the email monitor. */
  abstract readonly type: EmailType

  constructor(protected options: SupportTicketMailOptions) {
    super()
    this.subject = options.subject
  }

  prepare() {
    const recipients = Array.isArray(this.options.to) ? this.options.to : [this.options.to]
    for (const recipient of recipients) this.message.to(recipient)
    const data = { code: null, actionUrl: null, actionLabel: null, ...this.options.notice }
    this.message
      .htmlView('emails/customer_notice', data)
      .textView('emails/customer_notice_text', data)
    tagMail(this.message, {
      type: this.type,
      customerId: this.options.customerId,
      redact: this.options.redact,
    })
  }
}
