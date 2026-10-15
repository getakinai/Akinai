import { BaseMail } from '@adonisjs/mail'
import type { EmailType } from '#constants/email_logs'
import type { OrderEmailData } from '#mails/helpers/order_email_data'
import { tagMail } from '#mails/helpers/mail_meta'
import type { OrderDocumentAttachment } from '#services/order_document_service'

export type OrderMailOptions = {
  to: string | string[]
  subject: string
  data: OrderEmailData
  orderId: string
  customerId: string | null
  /** PDFs (invoice, receipt) attached to the email. */
  attachments?: OrderDocumentAttachment[]
}

/**
 * An email about an order, rendered with the shared `emails/order`
 * templates (HTML and text). The data is built by `orderEmailData()`.
 */
export default abstract class OrderMail extends BaseMail {
  /** Email type shown in the email monitor. */
  abstract readonly type: EmailType

  constructor(protected options: OrderMailOptions) {
    super()
    this.subject = options.subject
  }

  prepare() {
    const recipients = Array.isArray(this.options.to) ? this.options.to : [this.options.to]
    for (const recipient of recipients) this.message.to(recipient)
    this.message
      .htmlView('emails/order', this.options.data)
      .textView('emails/order_text', this.options.data)
    for (const attachment of this.options.attachments ?? []) {
      this.message.attachData(Buffer.from(attachment.contentBase64, 'base64'), {
        filename: attachment.filename,
        contentType: 'application/pdf',
      })
    }
    tagMail(this.message, {
      type: this.type,
      orderId: this.options.orderId,
      customerId: this.options.customerId,
    })
  }
}
