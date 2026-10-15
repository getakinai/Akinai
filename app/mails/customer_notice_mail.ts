import { BaseMail } from '@adonisjs/mail'
import { tagMail } from '#mails/helpers/mail_meta'
import type { EmailType } from '#constants/email_logs'

export type CustomerNotice = {
  title: string
  lines: string[]
  code?: string
  actionUrl?: string
  actionLabel?: string
  footer: string
}

/**
 * Plain transactional email to a customer, rendered with the shared
 * `emails/customer_notice` templates (HTML and text).
 */
export default abstract class CustomerNoticeMail extends BaseMail {
  /** Email type shown in the email monitor. */
  abstract readonly type: EmailType

  /** Set for emails carrying a one-time code, so the body is never logged. */
  protected readonly redact: boolean = false

  constructor(readonly to: string) {
    super()
  }

  protected abstract notice(): CustomerNotice

  prepare() {
    const notice = this.notice()
    const data = { code: null, actionUrl: null, actionLabel: null, ...notice }
    this.message
      .to(this.to)
      .htmlView('emails/customer_notice', data)
      .textView('emails/customer_notice_text', data)
    tagMail(this.message, { type: this.type, redact: this.redact })
  }
}
