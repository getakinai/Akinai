import { BaseMail } from '@adonisjs/mail'
import type EmailLog from '#models/email_log'
import { tagMail } from '#mails/helpers/mail_meta'
import { EMAIL_TYPES } from '#constants/email_logs'

/**
 * A copy of a logged email, sent again to the original recipients with the
 * stored subject and body.
 */
export default class ResentEmailMail extends BaseMail {
  constructor(
    protected original: EmailLog,
    protected resentByUserId: string
  ) {
    super()
    this.subject = original.subject
  }

  prepare() {
    const { original } = this
    this.message.to(original.toAddresses[0])
    for (const address of original.toAddresses.slice(1)) this.message.to(address)
    for (const address of original.ccAddresses ?? []) this.message.cc(address)
    for (const address of original.bccAddresses ?? []) this.message.bcc(address)
    if (original.html) this.message.html(original.html)
    if (original.text) this.message.text(original.text)

    tagMail(this.message, {
      type: EMAIL_TYPES.find((type) => type === original.type) ?? 'other',
      orderId: original.orderId,
      customerId: original.customerId,
      resentFromId: original.id,
      resentByUserId: this.resentByUserId,
    })
  }
}
